-- Create daily_quotes table for motivational quotes
CREATE TABLE public.daily_quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote TEXT NOT NULL,
    author TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active quotes
CREATE POLICY "Anyone can view active quotes" 
ON public.daily_quotes 
FOR SELECT 
USING (expires_at > now());

-- Only admins can manage quotes
CREATE POLICY "Admins can manage quotes" 
ON public.daily_quotes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for quotes
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_quotes;