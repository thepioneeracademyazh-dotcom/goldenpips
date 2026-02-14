import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildWelcomeEmailHtml(fullName: string, email: string): string {
  const displayName = fullName || email;
  return `<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f5e8; padding: 40px 20px; text-align: center;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 32px 30px 24px; text-align: center;">
      <img src="https://goldenpips.online/icons/icon-192x192.png" alt="GoldenPips" width="72" height="72" style="border-radius: 16px; margin-bottom: 12px; border: 2px solid rgba(212,160,23,0.3);" />
      <h1 style="color: #d4a017; margin: 0 0 4px 0; font-size: 26px;">Golden<span style="color: #ffffff;">Pips</span></h1>
      <p style="color: #aaa; font-size: 12px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Premium Gold Trading Signals</p>
    </div>
    <div style="padding: 32px 30px 40px;">
    
    <div style="background: #f9f5e8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 8px 0;">Welcome Aboard! 🎉</h2>
      <p style="color: #555; font-size: 15px; margin: 0;">Hello <strong>${displayName}</strong>,</p>
    </div>

    <p style="color: #444; font-size: 14px; line-height: 1.7; text-align: left; margin-bottom: 20px;">
      Your account has been successfully created on <strong>GoldenPips Trading Signals</strong>. Here are your account details:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: left;">
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Name</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #1a1a1a; font-size: 14px; font-weight: bold;">${displayName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Email</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #1a1a1a; font-size: 14px; font-weight: bold;">${email}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Plan</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #d4a017; font-size: 14px; font-weight: bold;">Free</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; color: #888; font-size: 13px;">Status</td>
        <td style="padding: 10px 12px; color: #27ae60; font-size: 14px; font-weight: bold;">✅ Verified</td>
      </tr>
    </table>

    <p style="color: #444; font-size: 14px; line-height: 1.7; text-align: left; margin-bottom: 24px;">
      You can now log in and explore our trading signals. Upgrade to <strong style="color: #d4a017;">Premium</strong> anytime to unlock all signals and exclusive features.
    </p>

    <a href="https://goldenpips.online" style="display: inline-block; background: linear-gradient(135deg, #d4a017, #b8860b); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: bold;">Open GoldenPips</a>

    <p style="color: #999; font-size: 11px; margin-top: 28px;">If you did not create this account, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('Email service not configured');

    // Send branded welcome email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GoldenPips <noreply@goldenpips.online>',
        to: [email],
        subject: 'Welcome to GoldenPips Trading Signals! 🎉',
        html: buildWelcomeEmailHtml(fullName || '', email),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend welcome email error:', err);
      throw new Error('Failed to send welcome email');
    }

    console.log(`Welcome email sent to: ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
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
