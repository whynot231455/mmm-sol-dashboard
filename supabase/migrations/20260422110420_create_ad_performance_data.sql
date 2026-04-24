CREATE TABLE public.ad_performance_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_id text NOT NULL,
  date date NOT NULL,
  campaign_name text,
  spend numeric DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.ad_performance_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ad performance data"
ON public.ad_performance_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad performance data"
ON public.ad_performance_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad performance data"
ON public.ad_performance_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad performance data"
ON public.ad_performance_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
