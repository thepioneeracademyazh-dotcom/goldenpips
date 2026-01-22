export type AppRole = 'admin' | 'user';
export type SubscriptionStatus = 'free' | 'premium' | 'expired';
export type SignalType = 'buy' | 'sell';
export type SignalStatus = 'active' | 'tp1_hit' | 'tp2_hit' | 'sl_hit' | 'closed';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  fcm_token: string | null;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  is_first_time_user: boolean;
  price_paid: number | null;
  payment_tx_hash: string | null;
  payment_gateway: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  signal_type: SignalType;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  status: SignalStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  network: string;
  tx_hash: string | null;
  payment_id: string | null;
  payment_gateway: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  sent_by: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: Profile | null;
  subscription: Subscription | null;
  roles: UserRole[];
  isAdmin: boolean;
  isPremium: boolean;
  isBlocked: boolean;
}
