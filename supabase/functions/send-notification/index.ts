import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  targetAudience: 'all' | 'premium' | 'free';
  data?: Record<string, string>;
}

// Create a JWT for Google OAuth2 using the service account
async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsignedToken));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error('Failed to get access token:', tokenData);
    throw new Error('Failed to get Firebase access token');
  }
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    if (!serviceAccountJson) {
      console.error('FIREBASE_SERVICE_ACCOUNT not configured');
      return new Response(
        JSON.stringify({ error: 'Firebase service account not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's token to validate it
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: NotificationPayload = await req.json();
    const { title, body, targetAudience, data } = payload;

    console.log('Sending notification:', { title, targetAudience });

    // Get FCM tokens
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('fcm_token, user_id')
      .not('fcm_token', 'is', null)
      .eq('is_blocked', false);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users with FCM tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by subscription status if needed
    let targetTokens: string[] = [];

    if (targetAudience === 'all') {
      targetTokens = profiles.map(p => p.fcm_token).filter(Boolean);
    } else {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, status, expires_at')
        .in('user_id', profiles.map(p => p.user_id));

      for (const profile of profiles) {
        const sub = subscriptions?.find(s => s.user_id === profile.user_id);
        const isPremium = sub?.status === 'premium' && 
          (!sub.expires_at || new Date(sub.expires_at) > new Date());

        if (targetAudience === 'premium' && isPremium && profile.fcm_token) {
          targetTokens.push(profile.fcm_token);
        } else if (targetAudience === 'free' && !isPremium && profile.fcm_token) {
          targetTokens.push(profile.fcm_token);
        }
      }
    }

    console.log(`Sending to ${targetTokens.length} devices`);

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No matching users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth2 access token using service account
    const accessToken = await getAccessToken(serviceAccount);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    let successCount = 0;
    let failureCount = 0;

    // Send individually using HTTP v1 API (notification-only, no data payload)
    for (const deviceToken of targetTokens) {
      try {
        const messagePayload = {
          message: {
            token: deviceToken,
            notification: {
              title,
              body,
            },
            android: {
              priority: 'high',
              notification: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                sound: 'default',
                default_sound: true,
                icon: 'ic_notification',
                channel_id: 'default',
              },
            },
            webpush: {
              headers: { Urgency: 'high' },
              notification: {
                title,
                body,
                icon: 'https://goldenpips.online/icons/icon-192x192.png',
                badge: 'https://goldenpips.online/icons/icon-72x72.png',
                requireInteraction: true,
              },
              fcm_options: {
                link: 'https://goldenpips.online',
              },
            },
          },
        };

        const res = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(messagePayload),
        });

        if (res.ok) {
          successCount++;
        } else {
          const errBody = await res.text();
          console.error(`FCM send failed for token ${deviceToken.substring(0, 10)}...:`, errBody);
          failureCount++;
        }
      } catch (err) {
        console.error('Error sending to device:', err);
        failureCount++;
      }
    }

    console.log(`Notification sent: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failureCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
