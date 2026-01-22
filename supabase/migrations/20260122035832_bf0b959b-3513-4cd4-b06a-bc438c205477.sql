-- Add is_blocked column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

-- Add blocked_at and blocked_reason columns for tracking
ALTER TABLE public.profiles 
ADD COLUMN blocked_at timestamp with time zone,
ADD COLUMN blocked_reason text;