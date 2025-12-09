import { supabase } from '../lib/supabase';
import type { Subscription } from '../types/Subscription';

export const subscriptionService = {
  // Get subscription for a user
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid errors on no rows

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as Subscription;
    } catch (error) {
      console.error('Unexpected error fetching subscription:', error);
      return null;
    }
  },

  // Create a trial subscription (internal helper)
  async createTrialSubscription(userId: string): Promise<Subscription | null> {
    try {
      // 14 days from now
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'trialing',
          current_period_end: trialEnd.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating trial subscription:', error);
        return null;
      }

      return data as Subscription;
    } catch (error) {
      console.error('Unexpected error creating subscription:', error);
      return null;
    }
  }
};
