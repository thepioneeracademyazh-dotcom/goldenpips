import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const DIRECT_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// On the published site (goldenpips.online), route through our own domain
// to bypass ISP blocks on the backend domain.
// In dev / preview, use the direct URL as-is.
const isPublished =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'goldenpips.online' ||
    window.location.hostname === 'www.goldenpips.online' ||
    window.location.hostname === 'goldenpips.lovable.app');

const PROXIED_URL = isPublished
  ? `${window.location.origin}/supabase`
  : DIRECT_URL;

export const supabase = createClient<Database>(PROXIED_URL, ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
