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
    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 12px;">Email Verification Code</h2>
    <p style="color: #555; font-size: 14px; margin-bottom: 24px;">Use the code below to verify your email address. This code expires in 10 minutes.</p>
    <div style="background: #f9f5e8; border: 2px solid #d4a017; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4a017;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 12px;">If you did not create an account, please ignore this email.</p>
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
      subject: 'GoldenPips - Email Verification Code',
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

    const { action, email, otp, fullName } = await req.json();

    if (action === 'send_otp') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Invalidate old OTPs for this email
      await supabase.from('signup_verification_otps').update({ used: true }).eq('email', email.toLowerCase()).eq('used', false);

      // Generate and store OTP
      const otpCode = generateOtp();
      const { error: insertError } = await supabase.from('signup_verification_otps').insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
      });
      if (insertError) throw insertError;

      // Send branded email
      await sendOtpEmail(email, otpCode);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify') {
      if (!email || !otp) {
        return new Response(JSON.stringify({ error: 'Email and OTP are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find valid OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from('signup_verification_otps')
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
      await supabase.from('signup_verification_otps').update({ used: true }).eq('id', otpRecord.id);

      // Find user and confirm email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Confirm user's email
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ensure profile, subscription, and role exist (handles re-registration after admin delete)
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!existingProfile) {
        await supabase.from('profiles').insert({ user_id: user.id, email: email.toLowerCase(), full_name: fullName || null });
      } else if (fullName) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
      }

      const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('user_id', user.id).maybeSingle();
      if (!existingSub) {
        await supabase.from('subscriptions').insert({ user_id: user.id, status: 'free', is_first_time_user: true });
      }

      const { data: existingRole } = await supabase.from('user_roles').select('id').eq('user_id', user.id).maybeSingle();
      if (!existingRole) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'user' });
      }

      // Send branded welcome email (fire-and-forget)
      const functionUrl = `${supabaseUrl}/functions/v1/send-welcome-email`;
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ email: email.toLowerCase(), fullName: fullName || null }),
      }).catch(err => console.error('Welcome email trigger failed:', err));

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in verify-signup:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
