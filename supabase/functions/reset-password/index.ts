import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkRateLimit(supabase: any, key: string, maxRequests: number, windowMinutes: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart);
  
  if ((count ?? 0) >= maxRequests) return false;
  
  await supabase.from('rate_limits').insert({ key });
  return true;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpEmailHtml(otp: string): string {
  return `<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f5e8; padding: 40px 20px; text-align: center;">
  <div style="max-width: 420px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 24px 20px; text-align: center;">
      <img src="https://goldenpips.online/icons/icon-192x192.png" alt="GoldenPips" width="56" height="56" style="border-radius: 12px; margin-bottom: 8px; border: 2px solid rgba(212,160,23,0.3);" />
      <h1 style="color: #d4a017; margin: 0 0 2px 0; font-size: 22px;">Golden<span style="color: #ffffff;">Pips</span></h1>
      <p style="color: #aaa; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Premium Gold Trading Signals</p>
    </div>
    <div style="padding: 32px 30px;">
    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 12px;">Password Reset Code</h2>
    <p style="color: #555; font-size: 14px; margin-bottom: 24px;">Use the code below to reset your password. This code expires in 10 minutes.</p>
    <div style="background: #f9f5e8; border: 2px solid #d4a017; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4a017;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
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
      to: [email],
      subject: 'GoldenPips Trading Signals - Password Reset Code',
      html: buildOtpEmailHtml(otp),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    throw new Error('Failed to send email');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, otp, new_password } = await req.json();

    if (action === 'send_otp') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Rate limit: 3 OTP sends per email per 10 minutes
      const allowed = await checkRateLimit(supabase, `reset_otp:${email.toLowerCase()}`, 3, 10);
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user exists (silently succeed if not to prevent enumeration)
      const { data: userData } = await supabase.auth.admin.listUsers();
      const userExists = userData?.users?.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (!userExists) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Invalidate old OTPs
      await supabase.from('password_reset_otps').update({ used: true }).eq('email', email.toLowerCase()).eq('used', false);

      // Generate and store OTP
      const otpCode = generateOtp();
      const { error: insertError } = await supabase.from('password_reset_otps').insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
      });
      if (insertError) throw insertError;

      // Send branded email with OTP
      await sendOtpEmail(email, otpCode);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify_and_reset') {
      if (!email || !otp || !new_password) {
        return new Response(JSON.stringify({ error: 'Email, OTP, and new password are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Rate limit: 5 verify attempts per email per 10 minutes
      const allowed = await checkRateLimit(supabase, `reset_verify:${email.toLowerCase()}`, 5, 10);
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Too many attempts. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new_password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find valid OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('otp_code', otp)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark OTP as used
      await supabase.from('password_reset_otps').update({ used: true }).eq('id', otpRecord.id);

      // Find user and update password
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        // Return generic error to prevent enumeration
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: new_password,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update password' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in reset-password:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
