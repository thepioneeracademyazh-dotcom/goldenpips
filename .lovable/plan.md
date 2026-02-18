

# Prevent First-Time Discount Abuse

## Problem
Users can create new accounts each month to exploit the $25 first-time discount repeatedly, losing $24/month per abuser.

## Solution: Multi-Layer Detection

### Layer 1: Crypto Wallet Tracking (Primary)
- Create a `known_wallets` table to store wallet addresses from completed payments
- When the payment webhook fires, extract the payer's wallet address from the NOWPayments payload
- Before activating premium, check if that wallet has been used on any other account
- If yes, set `is_first_time_user = false` on the new account (so next payment is $49)
- Store the wallet-to-user mapping for future checks

### Layer 2: Email Normalization (Secondary)
- When checking first-time status in the `create-payment` function, normalize the user's email:
  - Strip dots from Gmail usernames (`j.o.h.n@gmail.com` -> `john@gmail.com`)
  - Remove `+alias` suffixes (`john+test@gmail.com` -> `john@gmail.com`)
- Check if any other account with the same normalized email has had a subscription
- If match found, override `is_first_time_user` to `false`

### Layer 3: Admin Flagging
- Add a `flagged_abuse` boolean column to subscriptions
- Automatically flag accounts where wallet or email overlap is detected
- Surface these in the admin panel for manual review

## Technical Details

### New Database Table: `known_wallets`
```text
known_wallets
 - id (uuid, PK)
 - wallet_address (text, indexed)
 - user_id (uuid)
 - payment_id (text)
 - created_at (timestamptz)
```
No RLS policies needed (service-role access only from edge functions).

### New Database Table: `normalized_emails`
```text
normalized_emails
 - id (uuid, PK)
 - user_id (uuid, unique)
 - normalized_email (text, indexed)
 - created_at (timestamptz)
```
No RLS policies needed (service-role access only).

### Edge Function Changes

**`payment-webhook/index.ts`**:
- After verifying the webhook signature, extract `payin_address` (payer wallet) from the NOWPayments payload
- Insert into `known_wallets` table
- Check if wallet exists for a different user -- if so, update the current user's `is_first_time_user` to `false` and set `flagged_abuse = true`

**`create-payment/index.ts`**:
- Before determining price, normalize the user's email
- Query `normalized_emails` for matches on other accounts that have had subscriptions
- If match found, treat as returning user ($49 price)

### Schema Change on `subscriptions`
- Add `flagged_abuse boolean DEFAULT false` column

### Trigger on User Signup
- Update the `handle_new_user()` database function to also insert a normalized email record into `normalized_emails`

### File Changes Summary
1. **Database migration** -- create `known_wallets` table, `normalized_emails` table, add `flagged_abuse` column to `subscriptions`, update `handle_new_user()` function
2. **`supabase/functions/payment-webhook/index.ts`** -- extract wallet, check for abuse, store wallet
3. **`supabase/functions/create-payment/index.ts`** -- add email normalization check before pricing
4. **`src/pages/Admin.tsx`** -- surface flagged accounts (if admin panel lists users)
