import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FIRST_TIME_PRICE = 25;
const REGULAR_PRICE = 49;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Try getClaims first, fall back to getUser if unavailable
    let userId: string;
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      } else {
        // Fallback to getUser
        const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
        if (userError || !userData?.user) {
          console.error('Auth failed - getClaims:', claimsError, 'getUser:', userError);
          return new Response(
            JSON.stringify({ error: 'Invalid authentication' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        userId = userData.user.id;
      }
    } catch (authErr) {
      console.error('Auth exception:', authErr);
      // Final fallback
      const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = userData.user.id;
    }

    // Use service role client for data operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: 3 payment creations per user per 10 minutes
    const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', `create_payment:${userId}`)
      .gte('created_at', windowStart);
    
    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many payment requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await supabase.from('rate_limits').insert({ key: `create_payment:${userId}` });

    // Determine pricing server-side
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('is_first_time_user')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let isFirstTimeUser = subscription?.is_first_time_user ?? true;

    // Email normalization abuse check
    if (isFirstTimeUser) {
      // Get user's email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (profile?.email) {
        // Normalize the email
        const email = profile.email.toLowerCase();
        let [localPart, domain] = email.split('@');
        localPart = localPart.split('+')[0];
        if (domain === 'gmail.com' || domain === 'googlemail.com') {
          localPart = localPart.replace(/\./g, '');
        }
        const normalizedEmail = `${localPart}@${domain}`;

        // Check if any OTHER account with same normalized email has had a subscription
        const { data: matches } = await supabase
          .from('normalized_emails')
          .select('user_id')
          .eq('normalized_email', normalizedEmail)
          .neq('user_id', userId);

        if (matches && matches.length > 0) {
          // Check if any of those accounts ever had premium
          const matchedUserIds = matches.map(m => m.user_id);
          const { data: priorSubs } = await supabase
            .from('subscriptions')
            .select('user_id')
            .in('user_id', matchedUserIds)
            .eq('is_first_time_user', false);

          if (priorSubs && priorSubs.length > 0) {
            console.log(`Email abuse detected: ${normalizedEmail} matches existing account`);
            isFirstTimeUser = false;
            // Update DB so future checks are fast
            await supabase
              .from('subscriptions')
              .update({ is_first_time_user: false, flagged_abuse: true })
              .eq('user_id', userId);
          }
        }
      }
    }

    const amount = isFirstTimeUser ? FIRST_TIME_PRICE : REGULAR_PRICE;
    const currency = 'USDT';

    const nowpaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    
    if (!nowpaymentsApiKey) {
      console.log('NOWPayments API key not configured - returning mock payment URL');
      return new Response(
        JSON.stringify({ 
          paymentUrl: `https://nowpayments.io/payment/?amount=${amount}&currency=usdtbsc`,
          paymentId: `mock_${Date.now()}`,
          message: 'NOWPayments API key not configured. Configure NOWPAYMENTS_API_KEY secret for live payments.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment via NOWPayments API
    console.log('Creating NOWPayments invoice for user:', userId, 'amount:', amount);
    
    const origin = req.headers.get('origin') || 'https://goldenpips.online';
    
    const paymentResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': nowpaymentsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdtbsc',
        order_id: `golden_pips_${userId}_${Date.now()}`,
        order_description: 'Golden Pips Premium Subscription - 30 Days',
        ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
        success_url: `${origin}/subscription?success=true`,
        cancel_url: `${origin}/subscription?cancelled=true`,
      }),
    });

    const paymentData = await paymentResponse.json();
    console.log('NOWPayments response status:', paymentResponse.status, 'data:', JSON.stringify(paymentData));

    if (!paymentResponse.ok) {
      console.error('NOWPayments error:', JSON.stringify(paymentData));
      return new Response(
        JSON.stringify({ error: paymentData.message || 'Payment gateway error. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save payment record
    const { error: insertError } = await supabase.from('payment_history').insert({
      user_id: userId,
      amount,
      currency,
      payment_id: String(paymentData.id),
      status: 'pending',
    });
    
    if (insertError) {
      console.error('Failed to save payment record:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        paymentUrl: paymentData.invoice_url,
        paymentId: paymentData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
