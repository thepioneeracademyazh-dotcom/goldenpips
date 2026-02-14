const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PremiumEmailData {
  email: string;
  fullName: string | null;
  paymentId: string;
  amountPaid: number;
  currency: string;
  startedAt: string;
  expiresAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function buildPremiumEmailHtml(data: PremiumEmailData): string {
  const displayName = data.fullName || data.email;
  return `<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f5e8; padding: 40px 20px; text-align: center;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 24px 20px; text-align: center;">
      <img src="https://goldenpips.online/icons/icon-192x192.png" alt="GoldenPips" width="56" height="56" style="border-radius: 12px; margin-bottom: 8px; border: 2px solid rgba(212,160,23,0.3);" />
      <h1 style="color: #d4a017; margin: 0 0 2px 0; font-size: 22px;">Golden<span style="color: #ffffff;">Pips</span></h1>
      <p style="color: #aaa; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Premium Gold Trading Signals</p>
    </div>
    <div style="padding: 40px 30px;">

    <div style="background: linear-gradient(135deg, #d4a017, #b8860b); border-radius: 10px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #fff; font-size: 22px; margin: 0 0 6px 0;">🎉 Premium Activated!</h2>
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Congratulations, <strong>${displayName}</strong></p>
    </div>

    <p style="color: #444; font-size: 14px; line-height: 1.7; text-align: left; margin-bottom: 20px;">
      Your premium subscription has been successfully activated. Below are your payment and subscription details:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: left;">
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Payment ID</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #1a1a1a; font-size: 14px; font-weight: bold;">${data.paymentId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Amount Paid</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #27ae60; font-size: 14px; font-weight: bold;">$${data.amountPaid} ${data.currency}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Network</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #1a1a1a; font-size: 14px; font-weight: bold;">BEP20 (BSC)</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Plan</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #d4a017; font-size: 14px; font-weight: bold;">⭐ Premium (30 Days)</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #888; font-size: 13px;">Activated On</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #1a1a1a; font-size: 14px; font-weight: bold;">${formatDateTime(data.startedAt)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; color: #888; font-size: 13px;">Valid Until</td>
        <td style="padding: 10px 12px; color: #1a1a1a; font-size: 14px; font-weight: bold;">${formatDate(data.expiresAt)}</td>
      </tr>
    </table>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
      <p style="color: #166534; font-size: 13px; margin: 0 0 8px 0; font-weight: bold;">✅ What you now have access to:</p>
      <ul style="color: #166534; font-size: 13px; margin: 0; padding-left: 18px; line-height: 1.8;">
        <li>All premium XAUUSD trading signals</li>
        <li>Entry, TP1, TP2 & Stop Loss levels</li>
        <li>Real-time signal notifications</li>
        <li>Priority support</li>
      </ul>
    </div>

    <a href="https://goldenpips.online" style="display: inline-block; background: linear-gradient(135deg, #d4a017, #b8860b); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: bold;">Open GoldenPips</a>

    <p style="color: #999; font-size: 11px; margin-top: 28px;">Thank you for choosing GoldenPips. If you have questions, contact us at goldenpipsofficial1@gmail.com</p>
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
    const data: PremiumEmailData = await req.json();

    if (!data.email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('Email service not configured');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GoldenPips <noreply@goldenpips.online>',
        to: [data.email],
        subject: '⭐ Premium Subscription Activated - GoldenPips',
        html: buildPremiumEmailHtml(data),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend premium email error:', err);
      throw new Error('Failed to send premium email');
    }

    console.log(`Premium confirmation email sent to: ${data.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-premium-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
