-- Prevent duplicate email registrations in profiles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
