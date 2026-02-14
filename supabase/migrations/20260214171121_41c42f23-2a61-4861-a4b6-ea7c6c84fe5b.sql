
CREATE TABLE public.password_reset_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but no public policies (only service role access)
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Index for quick lookups
CREATE INDEX idx_password_reset_otps_email ON public.password_reset_otps (email, used, expires_at);
