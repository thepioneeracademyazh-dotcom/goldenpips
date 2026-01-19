import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    console.log('Received webhook payload:', JSON.stringify(body));
    
    // Extract payment data from NOWPayments IPN
    const {
      payment_id,
      payment_status,
      order_id,
      price_amount,
      actually_paid,
    } = body;

    // Only process finished payments
    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      console.log(`Payment ${payment_id} status: ${payment_status} - not processing`);
      return new Response(
        JSON.stringify({ message: 'Payment not finished yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from order_id (format: golden_pips_{userId}_{timestamp})
    const orderParts = order_id?.split('_');
    if (!orderParts || orderParts.length < 4) {
      console.error('Invalid order_id format:', order_id);
      return new Response(
        JSON.stringify({ error: 'Invalid order_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = orderParts[2];
    console.log(`Processing payment for user: ${userId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update payment history status
    const { error: paymentError } = await supabase
      .from('payment_history')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', payment_id?.toString());

    if (paymentError) {
      console.error('Error updating payment history:', paymentError);
    }

    // Calculate subscription expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update subscription to premium
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'premium',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_first_time_user: false,
        price_paid: price_amount,
        payment_gateway: 'nowpayments',
        payment_tx_hash: payment_id?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (subError) {
      console.error('Error updating subscription:', subError);
      throw subError;
    }

    console.log(`Successfully activated premium for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription activated',
        userId,
        expiresAt: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
