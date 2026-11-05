import { supabase } from './api';

export const paymentService = {
  async createCheckoutSession(priceId: string) {
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

      // The page shows a short message; the details stay in the console for whoever deploys.
      console.error(`Error iniciando sesión de pago: ${errorMessage}`);
      throw error;
    }

    const session = data?.session;

    if (!session?.url) {
       throw new Error('No checkout URL returned from backend');
    }

    // 2. Redirect to Stripe Checkout URL directly
    window.location.href = session.url;
  }
};
