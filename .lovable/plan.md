

## Admin Support Tools for User Account Issues

Currently, the admin "Manage" dropdown only offers: Upgrade to Premium, Block/Unblock, and Delete User. This plan adds the tools an admin needs to resolve common user support requests directly from the admin panel.

### New Admin Capabilities

1. **Reset User Password** -- Admin can set a new password for any user directly, solving "I forgot my password and can't receive emails" situations.

2. **View Payment History** -- Admin can see a user's payment records (amount, status, date, payment ID) to verify "I paid but didn't get access" claims.

3. **Manual Payment Confirmation** -- Admin can mark a pending payment as completed and activate premium, solving "payment done but access not granted" cases. This combines updating the payment record status and upgrading the subscription in one action.

---

### Technical Details

#### 1. Edge Function: `admin-reset-password`
- New backend function that accepts `{ userId, newPassword }`.
- Validates the caller is an admin by checking JWT claims against `user_roles`.
- Uses `supabase.auth.admin.updateUserById()` to set the new password.
- No email sent -- the admin communicates the new password to the user directly.

#### 2. Admin UI Changes (`src/pages/Admin.tsx`)
Add three new items to the existing "Manage" dropdown menu for each user:

- **"Reset Password"** -- Opens a dialog where the admin types a new password, then calls the `admin-reset-password` edge function.
- **"Payment History"** -- Opens a dialog showing all records from `payment_history` for that user (fetched on-demand).
- **"Confirm Payment"** -- Visible only if the user has a pending payment. Marks the payment as completed and activates 30-day premium in one click (reuses existing `handleManualUpgrade` logic + updates `payment_history` status).

#### 3. Menu Structure (Updated Dropdown)
```
Manage
  - Reset Password
  - Payment History
  - Confirm Payment (if pending payments exist)
  ---
  - Upgrade to Premium (if not premium)
  - Block / Unblock
  ---
  - Delete User
```

#### 4. Data Fetching
- Payment history will be fetched on-demand when the admin clicks "Payment History" for a specific user, querying `payment_history` table filtered by `user_id`.
- No new database tables or migrations needed -- all existing tables and RLS policies (admin has full access) already support these operations.

#### 5. Files to Create/Modify
- **Create**: `supabase/functions/admin-reset-password/index.ts`
- **Modify**: `src/pages/Admin.tsx` (add dialogs, handlers, dropdown items)

