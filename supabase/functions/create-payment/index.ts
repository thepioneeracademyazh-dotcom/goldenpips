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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Use service role client for data operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine pricing server-side
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('is_first_time_user')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isFirstTimeUser = subscription?.is_first_time_user ?? true;
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
        success_url: `${req.headers.get('origin')}/subscription?success=true`,
        cancel_url: `${req.headers.get('origin')}/subscription?cancelled=true`,
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error('NOWPayments error:', paymentData);
      throw new Error(paymentData.message || 'Failed to create payment');
    }

    // Save payment record
    await supabase.from('payment_history').insert({
      user_id: userId,
      amount,
      currency,
      payment_id: paymentData.id,
      status: 'pending',
    });

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
