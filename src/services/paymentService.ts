import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './api';

// Initialize Stripe with the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const paymentService = {
  async createCheckoutSession(priceId: string) {
    // Check if key is configured
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
       console.warn('Stripe Publishable Key not found. Falling back to mock.');
       // DEV FALLBACK:
       // return this.mockUpgradeToPro(userId); 
       // For this specific call, returning a mock URL:
       return 'https://checkout.stripe.com/mock-url'; 
    }

    // 1. Call your backend (Supabase Function) to create the session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId }
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      


      // Enhanced error reporting
      let errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.includes('FunctionsHttpError')) {
          errorMessage += "\n\n(Esto suele significar que la Edge Function de Supabase falló. Revisa si 'STRIPE_SECRET_KEY' está configurada en los Secretos de Supabase.)";
      }
      
      alert(`Error iniciando sesión de pago: ${errorMessage}`);
      throw error;
    }

    const session = data?.session;

    if (!session?.url) {
       throw new Error('No checkout URL returned from backend');
    }

    // 2. Redirect to Stripe Checkout URL directly
    window.location.href = session.url;
  },

  async mockUpgradeToPro(userId: string) {
    // DEV ONLY: Direct DB update to simulate success webhook
    const { error } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: 'pro' })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Also create a dummy subscription
    await supabase.from('subscriptions').insert({
        user_id: userId,
        status: 'active',
        stripe_subscription_id: 'sub_mock_123456',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
};
