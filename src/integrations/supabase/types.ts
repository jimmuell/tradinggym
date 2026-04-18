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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      backtest_runs: {
        Row: {
          avg_loser: number | null
          avg_winner: number | null
          created_at: string
          end_date: string
          id: string
          initial_balance: number
          losses: number | null
          max_drawdown: number | null
          max_trades_per_day: number
          net_pnl: number | null
          profit_factor: number | null
          start_date: string
          status: string
          stop_loss_ticks: number
          strategy_id: string | null
          strategy_name: string
          take_profit_ticks: number
          timeframe: string
          total_trades: number | null
          user_id: string
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_loser?: number | null
          avg_winner?: number | null
          created_at?: string
          end_date: string
          id?: string
          initial_balance?: number
          losses?: number | null
          max_drawdown?: number | null
          max_trades_per_day?: number
          net_pnl?: number | null
          profit_factor?: number | null
          start_date: string
          status?: string
          stop_loss_ticks?: number
          strategy_id?: string | null
          strategy_name: string
          take_profit_ticks?: number
          timeframe: string
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_loser?: number | null
          avg_winner?: number | null
          created_at?: string
          end_date?: string
          id?: string
          initial_balance?: number
          losses?: number | null
          max_drawdown?: number | null
          max_trades_per_day?: number
          net_pnl?: number | null
          profit_factor?: number | null
          start_date?: string
          status?: string
          stop_loss_ticks?: number
          strategy_id?: string | null
          strategy_name?: string
          take_profit_ticks?: number
          timeframe?: string
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backtest_runs_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_enrollments: {
        Row: {
          cancelled_at: string | null
          cohort_id: string
          enrolled_at: string
          id: string
          status: string
          stripe_subscription_id: string | null
          student_id: string
        }
        Insert: {
          cancelled_at?: string | null
          cohort_id: string
          enrolled_at?: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          student_id: string
        }
        Update: {
          cancelled_at?: string | null
          cohort_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string
          description: string | null
          guru_id: string
          id: string
          max_students: number | null
          name: string
          price_monthly: number
          status: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
          win_rate_gate: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          guru_id: string
          id?: string
          max_students?: number | null
          name: string
          price_monthly?: number
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          win_rate_gate?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          guru_id?: string
          id?: string
          max_students?: number | null
          name?: string
          price_monthly?: number
          status?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          win_rate_gate?: number
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guru_applications: {
        Row: {
          email: string
          existing_presence: string | null
          full_name: string
          id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string
          trading_style: string
          user_id: string
          what_you_teach: string
          years_experience: string
        }
        Insert: {
          email: string
          existing_presence?: string | null
          full_name: string
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          trading_style: string
          user_id: string
          what_you_teach: string
          years_experience: string
        }
        Update: {
          email?: string
          existing_presence?: string | null
          full_name?: string
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          trading_style?: string
          user_id?: string
          what_you_teach?: string
          years_experience?: string
        }
        Relationships: []
      }
      guru_content: {
        Row: {
          body: string
          cohort_id: string
          content_type: string
          created_at: string
          guru_id: string
          id: string
          is_draft: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          cohort_id: string
          content_type?: string
          created_at?: string
          guru_id: string
          id?: string
          is_draft?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          cohort_id?: string
          content_type?: string
          created_at?: string
          guru_id?: string
          id?: string
          is_draft?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guru_content_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_content_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guru_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_public: boolean
          primary_instrument: string | null
          primary_strategy: string | null
          referral_code: string | null
          referral_discount_pct: number | null
          slug: string | null
          status: string
          stripe_account_id: string | null
          stripe_connect_id: string | null
          stripe_connect_status: string | null
          stripe_onboarding_complete: boolean | null
          tagline: string | null
          trial_dismissed_count: number
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_public?: boolean
          primary_instrument?: string | null
          primary_strategy?: string | null
          referral_code?: string | null
          referral_discount_pct?: number | null
          slug?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_connect_id?: string | null
          stripe_connect_status?: string | null
          stripe_onboarding_complete?: boolean | null
          tagline?: string | null
          trial_dismissed_count?: number
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_public?: boolean
          primary_instrument?: string | null
          primary_strategy?: string | null
          referral_code?: string | null
          referral_discount_pct?: number | null
          slug?: string | null
          status?: string
          stripe_account_id?: string | null
          stripe_connect_id?: string | null
          stripe_connect_status?: string | null
          stripe_onboarding_complete?: boolean | null
          tagline?: string | null
          trial_dismissed_count?: number
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guru_referrals: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          guru_id: string | null
          id: string
          redeemed_at: string | null
          referral_code: string
          referred_user_id: string | null
          status: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          guru_id?: string | null
          id?: string
          redeemed_at?: string | null
          referral_code: string
          referred_user_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          guru_id?: string | null
          id?: string
          redeemed_at?: string | null
          referral_code?: string
          referred_user_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guru_referrals_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_attendance: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          cohort_id: string
          created_at: string
          description: string | null
          guru_id: string
          id: string
          partykit_room_id: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          description?: string | null
          guru_id: string
          id?: string
          partykit_room_id?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          description?: string | null
          guru_id?: string
          id?: string
          partykit_room_id?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          completed_modules: string[] | null
          created_at: string
          display_name: string | null
          id: string
          tier_state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          completed_modules?: string[] | null
          created_at?: string
          display_name?: string | null
          id?: string
          tier_state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          completed_modules?: string[] | null
          created_at?: string
          display_name?: string | null
          id?: string
          tier_state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          created_at: string | null
          description: string | null
          direction_bias: string | null
          entry_rules: string | null
          exit_rules: string | null
          id: string
          instrument: string | null
          is_system: boolean | null
          name: string
          notes: string | null
          tier_required: string | null
          timeframe: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          direction_bias?: string | null
          entry_rules?: string | null
          exit_rules?: string | null
          id?: string
          instrument?: string | null
          is_system?: boolean | null
          name: string
          notes?: string | null
          tier_required?: string | null
          timeframe?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          direction_bias?: string | null
          entry_rules?: string | null
          exit_rules?: string | null
          id?: string
          instrument?: string | null
          is_system?: boolean | null
          name?: string
          notes?: string | null
          tier_required?: string | null
          timeframe?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          closed_at: string | null
          created_at: string | null
          direction: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          opened_at: string | null
          pnl: number | null
          pnl_ticks: number | null
          result: string | null
          session_type: string | null
          steps_completed: number[] | null
          stop_loss: number | null
          symbol: string | null
          take_profit: number | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          opened_at?: string | null
          pnl?: number | null
          pnl_ticks?: number | null
          result?: string | null
          session_type?: string | null
          steps_completed?: number[] | null
          stop_loss?: number | null
          symbol?: string | null
          take_profit?: number | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          opened_at?: string | null
          pnl?: number | null
          pnl_ticks?: number | null
          result?: string | null
          session_type?: string | null
          steps_completed?: number[] | null
          stop_loss?: number | null
          symbol?: string | null
          take_profit?: number | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_guru_student_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          tier_state: string
          user_id: string
        }[]
      }
      get_guru_student_trades: {
        Args: { _student_id: string }
        Returns: {
          closed_at: string | null
          created_at: string | null
          direction: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          opened_at: string | null
          pnl: number | null
          pnl_ticks: number | null
          result: string | null
          session_type: string | null
          steps_completed: number[] | null
          stop_loss: number | null
          symbol: string | null
          take_profit: number | null
          timeframe: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trades"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_guru_directory: {
        Args: never
        Returns: {
          active_students: number
          avatar_url: string
          bio: string
          display_name: string
          id: string
          primary_instrument: string
          primary_strategy: string
          referral_code: string
          referral_discount_pct: number
          tagline: string
          tier_state: string
          total_trades: number
          user_id: string
          win_rate: number
        }[]
      }
      get_public_guru_profile: {
        Args: { _guru_id: string }
        Returns: {
          active_students: number
          avatar_url: string
          bio: string
          display_name: string
          id: string
          primary_instrument: string
          primary_strategy: string
          referral_code: string
          referral_discount_pct: number
          tagline: string
          tier_state: string
          total_trades: number
          user_id: string
          win_rate: number
        }[]
      }
      guru_has_student: { Args: { _student_id: string }; Returns: boolean }
      update_own_profile: {
        Args: { p_avatar_url?: string; p_display_name?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
