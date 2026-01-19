import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, amount, currency } = await req.json();

    if (!userId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowpaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    
    if (!nowpaymentsApiKey) {
      console.log('NOWPayments API key not configured - returning mock payment URL');
      // Return a mock response for testing
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('payment_history').insert({
      user_id: userId,
      amount,
      currency: currency || 'USDT',
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
