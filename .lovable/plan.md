

## Set Site URL to goldenpips.online

### What needs to happen

The backend authentication system needs its **Site URL** configured to `https://goldenpips.online`. This ensures all authentication emails (password reset, OTP, welcome) reference your custom domain instead of the default preview URL.

### Changes

**1. Update `supabase/config.toml`**

Add the site URL setting to the auth configuration:

```toml
[auth]
site_url = "https://goldenpips.online"
```

This tells the authentication system that your app lives at `goldenpips.online`, so any email templates using `{{ .SiteURL }}` will point to the correct domain.

**2. Update `index.html` (optional cleanup)**

Update the Open Graph image URLs from `goldenpips.lovable.app` to `goldenpips.online` for consistency:
- `og:image` -> `https://goldenpips.online/icons/icon-512x512.png`
- `twitter:image` -> `https://goldenpips.online/icons/icon-512x512.png`

### Technical Details

- The `site_url` in `supabase/config.toml` under `[auth]` sets the base URL used by the authentication system for all email communications and redirects.
- This is the root fix to ensure OTP emails and any future auth flows reference your production domain.

