

## Fix: Password Reset Sends Link Instead of OTP

### Problem
The `resetPasswordForEmail` function uses the hosted backend's default email template, which includes a clickable reset link. The custom template in `config.toml` only applies to local development, not the hosted environment. That's why users receive a link instead of a 6-digit OTP code.

### Solution
Build a fully custom OTP-based password reset flow using a backend function and a dedicated database table, giving us complete control over the email content.

### Changes

**1. Create a `password_reset_otps` table**
- Columns: `id`, `email`, `otp_code` (6-digit), `expires_at`, `used`, `created_at`
- RLS: No public access (only the backend function interacts with it via service role)

**2. Create a `reset-password` backend function**
- Accepts two actions:
  - `send_otp`: Generates a random 6-digit code, stores it in the table, and sends a branded "GoldenPips Trading Signals" email with just the OTP code (no link)
  - `verify_and_reset`: Validates the OTP against the table, checks expiry, then uses the admin API to update the user's password
- This replaces both `resetPasswordForEmail` and `verifyOtp` calls

**3. Update `src/pages/ForgotPassword.tsx`**
- Replace `supabase.auth.resetPasswordForEmail()` with a call to the new `reset-password` function (action: `send_otp`)
- Replace `supabase.auth.verifyOtp()` and `supabase.auth.updateUser()` with a single call to the `reset-password` function (action: `verify_and_reset`) that validates OTP and sets the new password in one step
- The 3-step UI flow (email, OTP, new-password) stays the same

### Flow

Step 1: User enters email -> frontend calls `reset-password` with `send_otp` -> backend generates OTP, emails it as a 6-digit code with GoldenPips branding

Step 2: User enters OTP + new password -> frontend calls `reset-password` with `verify_and_reset` -> backend checks OTP, updates password via admin API

### Why This Works
- Complete control over email content (no link, just OTP)
- GoldenPips branding in the email
- No dependency on hosted email templates we can't modify
- Secure: OTP expires in 10 minutes, single-use, validated server-side

