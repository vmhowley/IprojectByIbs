import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  const body = await req.text()
  let event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
  )

  console.log(`Received event type: ${event.type}`)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id
      
      if (userId) {
        console.log(`Upgrading user ${userId} to PRO`)
        
        // 1. Update Profile to PRO
        const { error: profileError } = await supabaseClient
          .from('user_profiles')
          .update({ 
            subscription_tier: 'pro',
            stripe_customer_id: session.customer
          })
          .eq('id', userId)

        if (profileError) console.error('Error updating profile:', profileError)

        // 2. Log subscription
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: userId,
            status: 'active',
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            // Assuming current_period_end comes from session if expanded or standard fields
            // For now, simple insert to track existence
          })
          
        if (subError) console.error('Error creating subscription record:', subError)
      } else {
          console.warn('No user_id found in session metadata')
      }
      break
    }
    // Handle other events like payment_failed or subscription_deleted
    case 'customer.subscription.deleted': {
         // Downgrade user...
         break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
