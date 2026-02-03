-- Enable realtime for signals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;

-- Add admin policy to UPDATE profiles (for blocking users)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to DELETE profiles
CREATE POLICY "Admins can delete all profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));