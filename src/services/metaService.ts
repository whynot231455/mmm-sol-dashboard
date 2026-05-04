import { supabase } from '../lib/supabase';

export interface MetaMockInsight {
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export const metaService = {
  /**
   * Fetches the mapped ad account ID for the current user from Supabase.
   */
  getMappedAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('client_ad_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching mapped account:', error);
      return null;
    }

    return data;
  },

  /**
   * Fetches mock insights from our Express backend.
   */
  fetchMockInsights: async (accountId: string): Promise<MetaMockInsight[]> => {
    try {
      // Use the environment variable for the backend URL if available, fallback to localhost:3001
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/meta/insights?account_id=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mock insights');
      }

      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error('Error in fetchMockInsights:', error);
      return [];
    }
  }
};
