export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_quotes: {
        Row: {
          author: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          quote: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          quote: string
        }
        Update: {
          author?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          quote?: string
        }
        Relationships: []
      }
      known_wallets: {
        Row: {
          created_at: string
          id: string
          payment_id: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      normalized_emails: {
        Row: {
          created_at: string
          id: string
          normalized_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          normalized_email?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_by: string
          target_audience: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_by: string
          target_audience?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_by?: string
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          otp_code: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used?: boolean
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          network: string
          payment_gateway: string
          payment_id: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          network?: string
          payment_gateway?: string
          payment_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          network?: string
          payment_gateway?: string
          payment_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_session_id: string | null
          avatar_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string
          email: string
          fcm_token: string | null
          full_name: string | null
          id: string
          is_blocked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active_session_id?: string | null
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          email: string
          fcm_token?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active_session_id?: string | null
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string
          fcm_token?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          created_at: string
          created_by: string
          entry_price: number
          id: string
          notes: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          status: Database["public"]["Enums"]["signal_status"]
          stop_loss: number
          take_profit_1: number
          take_profit_2: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entry_price: number
          id?: string
          notes?: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["signal_status"]
          stop_loss: number
          take_profit_1: number
          take_profit_2: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entry_price?: number
          id?: string
          notes?: string | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["signal_status"]
          stop_loss?: number
          take_profit_1?: number
          take_profit_2?: number
          updated_at?: string
        }
        Relationships: []
      }
      signup_verification_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          otp_code: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          flagged_abuse: boolean
          id: string
          is_first_time_user: boolean
          payment_gateway: string | null
          payment_tx_hash: string | null
          price_paid: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          flagged_abuse?: boolean
          id?: string
          is_first_time_user?: boolean
          payment_gateway?: string | null
          payment_tx_hash?: string | null
          price_paid?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          flagged_abuse?: boolean
          id?: string
          is_first_time_user?: boolean
          payment_gateway?: string | null
          payment_tx_hash?: string | null
          price_paid?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      signals_secure: {
        Row: {
          created_at: string | null
          created_by: string | null
          entry_price: number | null
          id: string | null
          notes: string | null
          signal_type: Database["public"]["Enums"]["signal_type"] | null
          status: Database["public"]["Enums"]["signal_status"] | null
          stop_loss: number | null
          take_profit_1: number | null
          take_profit_2: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entry_price?: never
          id?: string | null
          notes?: string | null
          signal_type?: Database["public"]["Enums"]["signal_type"] | null
          status?: Database["public"]["Enums"]["signal_status"] | null
          stop_loss?: never
          take_profit_1?: never
          take_profit_2?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entry_price?: never
          id?: string | null
          notes?: string | null
          signal_type?: Database["public"]["Enums"]["signal_type"] | null
          status?: Database["public"]["Enums"]["signal_status"] | null
          stop_loss?: never
          take_profit_1?: never
          take_profit_2?: never
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_subscription_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_status"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
      is_user_blocked: { Args: { _user_id: string }; Returns: boolean }
      normalize_email: { Args: { raw_email: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      signal_status: "active" | "tp1_hit" | "tp2_hit" | "sl_hit" | "closed"
      signal_type: "buy" | "sell"
      subscription_status: "free" | "premium" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      signal_status: ["active", "tp1_hit", "tp2_hit", "sl_hit", "closed"],
      signal_type: ["buy", "sell"],
      subscription_status: ["free", "premium", "expired"],
    },
  },
} as const
