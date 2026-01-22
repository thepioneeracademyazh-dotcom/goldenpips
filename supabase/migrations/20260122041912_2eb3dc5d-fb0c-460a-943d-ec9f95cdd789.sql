-- Enable realtime for profiles table to detect when users are blocked
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;