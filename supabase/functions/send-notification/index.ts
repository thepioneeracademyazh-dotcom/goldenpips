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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FCM not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: NotificationPayload = await req.json();
    const { title, body, targetAudience, data } = payload;

    console.log('Sending notification:', { title, targetAudience });

    // Get FCM tokens based on target audience
    let query = supabase
      .from('profiles')
      .select('fcm_token, user_id')
      .not('fcm_token', 'is', null)
      .eq('is_blocked', false);

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users with FCM tokens found');
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
      // Get subscription status for each user
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

    // Send to FCM (batch of 500 max)
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < targetTokens.length; i += 500) {
      const batch = targetTokens.slice(i, i + 500);
      
      const fcmPayload = {
        registration_ids: batch,
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          click_action: '/',
        },
        data: data || {},
      };

      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${fcmServerKey}`,
        },
        body: JSON.stringify(fcmPayload),
      });

      const fcmResult = await fcmResponse.json();
      console.log('FCM Response:', fcmResult);

      successCount += fcmResult.success || 0;
      failureCount += fcmResult.failure || 0;
    }

    console.log(`Notification sent: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failureCount 
      }),
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
