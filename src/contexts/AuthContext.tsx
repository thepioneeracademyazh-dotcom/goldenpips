import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Subscription, UserRole, User } from '@/types';
import { getFCMToken } from '@/lib/firebase';

// Request notification permission and save FCM token using Firebase
async function requestNotificationPermission(userId: string) {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications not supported');
      return;
    }

    const token = await getFCMToken();
    
    if (token) {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('FCM token saved successfully');
      }
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
}

// Generate a unique session ID
function generateSessionId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const SESSION_ID_KEY = 'gp_session_id';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, email: string): Promise<User> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    const isAdmin = roles?.some(r => r.role === 'admin') || false;
    
    const isPremium = subscription?.status === 'premium' && 
      (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

    const isBlocked = profile?.is_blocked || false;

    return {
      id: userId,
      email,
      profile: profile as Profile | null,
      subscription: subscription as Subscription | null,
      roles: (roles as UserRole[]) || [],
      isAdmin,
      isPremium,
      isBlocked,
    };
  };

  const refreshUserData = async () => {
    if (!session?.user) return;
    
    try {
      const userData = await fetchUserData(session.user.id, session.user.email || '');
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Single device enforcement: check if this session is still active
  const checkSingleDevice = async (userId: string) => {
    const localSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!localSessionId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_session_id')
        .eq('user_id', userId)
        .single();

      if (profile?.active_session_id && profile.active_session_id !== localSessionId) {
        // Another device logged in — force sign out
        console.log('Session invalidated by another device login');
        localStorage.removeItem(SESSION_ID_KEY);
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error checking single device:', error);
    }
  };

  // Register this device as the active session
  const registerDeviceSession = async (userId: string) => {
    const sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);

    try {
      await supabase
        .from('profiles')
        .update({ active_session_id: sessionId })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error registering device session:', error);
    }
  };

  useEffect(() => {
    let profileSubscription: ReturnType<typeof supabase.channel> | null = null;
    let singleDeviceInterval: ReturnType<typeof setInterval> | null = null;

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserData(currentSession.user.id, currentSession.user.email || '')
              .then((userData) => {
                setUser(userData);
                requestNotificationPermission(currentSession.user.id);
              })
              .catch(console.error)
              .finally(() => setLoading(false));
          }, 0);

          // Subscribe to profile changes (for block/session detection)
          profileSubscription = supabase
            .channel('profile-changes')
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `user_id=eq.${currentSession.user.id}`,
              },
              () => {
                // Check if session was invalidated
                checkSingleDevice(currentSession.user.id);
                // Refresh user data
                fetchUserData(currentSession.user.id, currentSession.user.email || '')
                  .then(setUser)
                  .catch(console.error);
              }
            )
            .subscribe();

          // Periodically check single device (every 30s)
          singleDeviceInterval = setInterval(() => {
            checkSingleDevice(currentSession.user.id);
          }, 30000);
        } else {
          setUser(null);
          setLoading(false);
          if (profileSubscription) {
            supabase.removeChannel(profileSubscription);
          }
          if (singleDeviceInterval) {
            clearInterval(singleDeviceInterval);
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id, currentSession.user.email || '')
          .then((userData) => {
            setUser(userData);
            // Check single device on load
            checkSingleDevice(currentSession.user.id);
          })
          .catch(console.error)
          .finally(() => setLoading(false));

        profileSubscription = supabase
          .channel('profile-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `user_id=eq.${currentSession.user.id}`,
            },
            () => {
              checkSingleDevice(currentSession.user.id);
              fetchUserData(currentSession.user.id, currentSession.user.email || '')
                .then(setUser)
                .catch(console.error);
            }
          )
          .subscribe();
      } else {
        setLoading(false);
      }
    });

    return () => {
      authSubscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
      if (singleDeviceInterval) {
        clearInterval(singleDeviceInterval);
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Register this device as the active session
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await registerDeviceSession(authUser.id);
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_ID_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
