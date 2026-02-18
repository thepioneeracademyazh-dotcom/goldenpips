
-- Table: known_wallets (service-role only, no RLS policies)
CREATE TABLE public.known_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  user_id UUID NOT NULL,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.known_wallets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_known_wallets_address ON public.known_wallets (wallet_address);
CREATE INDEX idx_known_wallets_user ON public.known_wallets (user_id);

-- Table: normalized_emails (service-role only, no RLS policies)
CREATE TABLE public.normalized_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  normalized_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.normalized_emails ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_normalized_emails_email ON public.normalized_emails (normalized_email);

-- Add flagged_abuse column to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN flagged_abuse BOOLEAN NOT NULL DEFAULT false;

-- Email normalization function
CREATE OR REPLACE FUNCTION public.normalize_email(raw_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  local_part TEXT;
  domain_part TEXT;
BEGIN
  local_part := split_part(lower(raw_email), '@', 1);
  domain_part := split_part(lower(raw_email), '@', 2);
  
  -- Remove +alias suffix
  local_part := split_part(local_part, '+', 1);
  
  -- Strip dots for Gmail
  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := replace(local_part, '.', '');
  END IF;
  
  RETURN local_part || '@' || domain_part;
END;
$$;

-- Update handle_new_user() to also insert normalized email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    
    -- Create default subscription (free)
    INSERT INTO public.subscriptions (user_id, status, is_first_time_user)
    VALUES (NEW.id, 'free', true);
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Store normalized email for abuse detection
    INSERT INTO public.normalized_emails (user_id, normalized_email)
    VALUES (NEW.id, public.normalize_email(NEW.email));
    
    RETURN NEW;
END;
$$;
