-- Create table for mapping users to ad accounts
CREATE TABLE public.client_ad_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  market text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_ad_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ad accounts"
ON public.client_ad_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad accounts"
ON public.client_ad_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad accounts"
ON public.client_ad_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad accounts"
ON public.client_ad_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add unique constraint to prevent multiple mappings for the same account for one user
ALTER TABLE public.client_ad_accounts ADD CONSTRAINT unique_user_ad_account UNIQUE (user_id, ad_account_id);
