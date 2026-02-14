import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpEmailHtml(otp: string): string {
  return `<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f5e8; padding: 40px 20px; text-align: center;">
  <div style="max-width: 420px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <h1 style="color: #d4a017; margin-bottom: 8px; font-size: 24px;">Golden<span style="color: #1a1a1a;">Pips</span></h1>
    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Premium Gold Trading Signals</p>
    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 12px;">Password Reset Code</h2>
    <p style="color: #555; font-size: 14px; margin-bottom: 24px;">Use the code below to reset your password. This code expires in 10 minutes.</p>
    <div style="background: #f9f5e8; border: 2px solid #d4a017; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4a017;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
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
      from: 'GoldenPips <onboarding@resend.dev>',
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
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: new_password,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
