import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Subscription, UserRole, User } from '@/types';

// Request notification permission and save FCM token
async function requestNotificationPermission(userId: string) {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // For web push, we use the Push API subscription endpoint as a pseudo-token
    // In production, you'd use Firebase SDK, but for PWA we use PushSubscription
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Use the endpoint as the token identifier
      const token = subscription.endpoint;
      
      // Save to profile
      await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('user_id', userId);
      
      console.log('Push subscription saved');
    } else {
      // Try to subscribe (requires VAPID key in production)
      console.log('No push subscription available - FCM requires Firebase setup');
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
}

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
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    const isAdmin = roles?.some(r => r.role === 'admin') || false;
    
    // Check premium status considering expiry
    const isPremium = subscription?.status === 'premium' && 
      (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

    // Check if user is blocked
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

  useEffect(() => {
    let profileSubscription: ReturnType<typeof supabase.channel> | null = null;

    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer fetching additional data with setTimeout
          setTimeout(() => {
            fetchUserData(currentSession.user.id, currentSession.user.email || '')
              .then((userData) => {
                setUser(userData);
                // Request notification permission after login
                requestNotificationPermission(currentSession.user.id);
              })
              .catch(console.error)
              .finally(() => setLoading(false));
          }, 0);

          // Subscribe to profile changes (for block detection)
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
              (payload) => {
                // Refresh user data when profile is updated
                fetchUserData(currentSession.user.id, currentSession.user.email || '')
                  .then(setUser)
                  .catch(console.error);
              }
            )
            .subscribe();
        } else {
          setUser(null);
          setLoading(false);
          if (profileSubscription) {
            supabase.removeChannel(profileSubscription);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id, currentSession.user.email || '')
          .then(setUser)
          .catch(console.error)
          .finally(() => setLoading(false));

        // Subscribe to profile changes (for block detection)
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
            (payload) => {
              // Refresh user data when profile is updated
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
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
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
