import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, type } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, log the welcome email request
    // Supabase handles transactional auth emails (OTP, recovery) via its built-in email service
    // This function can be extended with a custom SMTP provider (e.g., Resend, SendGrid) for branded emails
    console.log(`Welcome email requested for: ${email}, type: ${type}`);

    // Use Supabase's built-in email by leveraging the admin API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === 'welcome') {
      // Store a notification record for the welcome
      await supabase.from('notifications').insert({
        title: 'Welcome to GoldenPips Trading Signals! 🎉',
        body: `Welcome aboard, ${email}! You've successfully registered. Start exploring premium gold trading signals today.`,
        target_audience: 'all',
        sent_by: '00000000-0000-0000-0000-000000000000',
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} email processed for ${email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-welcome-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
