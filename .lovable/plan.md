
# Fix: Proxy Backend Requests Through Your Custom Domain

## Problem
The backend service domain is being blocked by ISPs in India, causing all "Failed to fetch" errors. Your app tries to connect directly to the backend URL, which gets blocked at the network level.

## Solution
Route all backend requests through your own domain (goldenpips.online) using Vercel rewrites. The browser will talk to `goldenpips.online/supabase/...` instead of the blocked domain, and Vercel's servers (which are NOT blocked) will forward those requests.

```text
Browser (India)
   |
   v
goldenpips.online/supabase/*   <-- Your domain (NOT blocked)
   |
   v  (Vercel forwards internally)
   |
Backend API server             <-- Happens outside India
```

## Steps

### 1. Add Vercel Rewrites
Update `vercel.json` to forward `/supabase/*` paths to the actual backend URL. This acts as a transparent proxy.

### 2. Create a Proxy-Aware Client Wrapper
Since the auto-generated client file cannot be edited, create a new wrapper module (`src/lib/supabase-proxy.ts`) that:
- Creates a new client pointing to your own domain's `/supabase` path instead of the direct backend URL
- Exports this proxied client

### 3. Update All Imports
Replace all imports of `@/integrations/supabase/client` across the app (~10 files) to use the new proxy-aware client instead. This ensures every database call, auth request, and realtime subscription goes through your domain.

### Files Changed
- `vercel.json` -- add rewrite rule for `/supabase/:path*`
- `src/lib/supabase-proxy.ts` -- new file, proxy-aware client
- `src/contexts/AuthContext.tsx` -- update import
- `src/pages/Home.tsx` -- update import
- `src/pages/Signals.tsx` -- update import
- `src/pages/Auth.tsx` -- update import
- `src/pages/Admin.tsx` -- update import
- `src/pages/Profile.tsx` -- update import
- `src/pages/Subscription.tsx` -- update import
- `src/pages/PaymentHistory.tsx` -- update import
- `src/components/DailyQuote.tsx` -- update import
- `src/components/SignalCard.tsx` -- update import
- `src/components/NotificationBell.tsx` -- update import
- `src/components/SubscriptionExpiryAlert.tsx` -- update import
- Any other files importing the client

### Important Notes
- This only works on the **published** site (goldenpips.online / goldenpips.lovable.app), not in local dev
- The Lovable preview will continue working as-is since it's not affected by ISP blocks
- After publishing, users in India will be able to use the app without a VPN

### Immediate Workaround
While this fix is being published, you (and your users) can use a **free VPN** (like Cloudflare WARP / 1.1.1.1 app) to bypass the block temporarily.
