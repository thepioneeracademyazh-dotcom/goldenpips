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
    // Verify webhook signature from NOWPayments
    const signature = req.headers.get('x-nowpayments-sig');
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_KEY');

    if (!ipnSecret) {
      console.error('NOWPAYMENTS_IPN_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signature) {
      console.error('Missing x-nowpayments-sig header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read body as text for signature verification, then parse
    const bodyText = await req.text();

    // NOWPayments signs the sorted JSON payload with HMAC-SHA512
    const bodyObj = JSON.parse(bodyText);
    const sortedKeys = Object.keys(bodyObj).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = bodyObj[key];
    }
    const sortedBody = JSON.stringify(sortedObj);

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(ipnSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sortedBody));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSig) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = bodyObj;
    console.log('Verified webhook payload:', JSON.stringify(body));
    
    const {
      payment_id,
      payment_status,
      order_id,
      price_amount,
      payin_address,
    } = body;

    // Only process finished payments
    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      console.log(`Payment ${payment_id} status: ${payment_status} - not processing`);
      return new Response(
        JSON.stringify({ message: 'Payment not finished yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Idempotency check: skip if payment already completed
    const { data: existingPayment } = await supabase
      .from('payment_history')
      .select('status')
      .eq('payment_id', payment_id?.toString())
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPayment) {
      console.log(`Payment ${payment_id} already processed - skipping`);
      return new Response(
        JSON.stringify({ message: 'Payment already processed' }),
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

    // supabase client already created above for idempotency check

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

    // --- Wallet-based abuse detection ---
    if (payin_address) {
      // Store wallet mapping
      await supabase.from('known_wallets').insert({
        wallet_address: payin_address,
        user_id: userId,
        payment_id: payment_id?.toString(),
      });

      // Check if this wallet was used by a different user
      const { data: existingWallets } = await supabase
        .from('known_wallets')
        .select('user_id')
        .eq('wallet_address', payin_address)
        .neq('user_id', userId)
        .limit(1);

      if (existingWallets && existingWallets.length > 0) {
        console.log(`Abuse detected: wallet ${payin_address} used by another user`);
        await supabase
          .from('subscriptions')
          .update({ is_first_time_user: false, flagged_abuse: true })
          .eq('user_id', userId);
      }
    }

    // Send premium confirmation email (fire-and-forget)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .single();

    if (profile?.email) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      fetch(`${supabaseUrl}/functions/v1/send-premium-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          email: profile.email,
          fullName: profile.full_name,
          paymentId: payment_id?.toString(),
          amountPaid: price_amount,
          currency: 'USDT',
          startedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        }),
      }).catch(err => console.error('Premium email trigger failed:', err));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription activated',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
