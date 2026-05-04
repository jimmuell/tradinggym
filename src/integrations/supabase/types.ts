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
      checklist_sessions: {
        Row: {
          created_at: string
          emotional_readiness: boolean | null
          execution_complete: boolean | null
          execution_completed: Json
          htf_bias: string | null
          id: string
          max_daily_loss: number | null
          prep_complete: boolean | null
          session_date: string
          session_prep_completed: Json
          strategy_name: string
          template_id: string
          trading_session: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_readiness?: boolean | null
          execution_complete?: boolean | null
          execution_completed?: Json
          htf_bias?: string | null
          id?: string
          max_daily_loss?: number | null
          prep_complete?: boolean | null
          session_date?: string
          session_prep_completed?: Json
          strategy_name: string
          template_id: string
          trading_session?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_readiness?: boolean | null
          execution_complete?: boolean | null
          execution_completed?: Json
          htf_bias?: string | null
          id?: string
          max_daily_loss?: number | null
          prep_complete?: boolean | null
          session_date?: string
          session_prep_completed?: Json
          strategy_name?: string
          template_id?: string
          trading_session?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          execution_items: Json
          id: string
          is_default: boolean | null
          session_prep_items: Json
          strategy_id: string | null
          strategy_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_items?: Json
          id?: string
          is_default?: boolean | null
          session_prep_items?: Json
          strategy_id?: string | null
          strategy_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          execution_items?: Json
          id?: string
          is_default?: boolean | null
          session_prep_items?: Json
          strategy_id?: string | null
          strategy_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          billing_starts_at: string | null
          cancelled_at: string | null
          class_id: string
          commission_rate: number | null
          discount_applied: boolean | null
          enrolled_at: string
          enrollment_type: string | null
          id: string
          referral_code: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          student_id: string
          trial_expires_at: string | null
        }
        Insert: {
          billing_starts_at?: string | null
          cancelled_at?: string | null
          class_id: string
          commission_rate?: number | null
          discount_applied?: boolean | null
          enrolled_at?: string
          enrollment_type?: string | null
          id?: string
          referral_code?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_id: string
          trial_expires_at?: string | null
        }
        Update: {
          billing_starts_at?: string | null
          cancelled_at?: string | null
          class_id?: string
          commission_rate?: number | null
          discount_applied?: boolean | null
          enrolled_at?: string
          enrollment_type?: string | null
          id?: string
          referral_code?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_id?: string
          trial_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_enrollments_cohort_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
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
          {
            foreignKeyName: "cohorts_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_settings: {
        Row: {
          commission_per_trade: number
          default_contracts: number
          max_consecutive_losses: number | null
          max_daily_loss: number | null
          monthly_data_fee: number
          planned_trades: number | null
          tick_value: number
          trading_days_per_month: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_per_trade?: number
          default_contracts?: number
          max_consecutive_losses?: number | null
          max_daily_loss?: number | null
          monthly_data_fee?: number
          planned_trades?: number | null
          tick_value?: number
          trading_days_per_month?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_per_trade?: number
          default_contracts?: number
          max_consecutive_losses?: number | null
          max_daily_loss?: number | null
          monthly_data_fee?: number
          planned_trades?: number | null
          tick_value?: number
          trading_days_per_month?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          class_id: string
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
          class_id: string
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
          class_id?: string
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
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_content_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_content_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      guru_profiles: {
        Row: {
          bio: string | null
          created_at: string
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
          bio?: string | null
          created_at?: string
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
          bio?: string | null
          created_at?: string
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
            foreignKeyName: "guru_referrals_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles_public"
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
      investor_documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      investor_notes: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "investor_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          assigned_to_email: string | null
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          purpose: string | null
          times_used: number | null
        }
        Insert: {
          assigned_to_email?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          purpose?: string | null
          times_used?: number | null
        }
        Update: {
          assigned_to_email?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          purpose?: string | null
          times_used?: number | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          author_id: string | null
          class_id: string | null
          content_type: string
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_published: boolean | null
          module: string
          module_order: number
          slides: Json
          tier_required: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          class_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean | null
          module: string
          module_order?: number
          slides?: Json
          tier_required?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          class_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean | null
          module?: string
          module_order?: number
          slides?: Json
          tier_required?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
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
          class_id: string
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
          class_id: string
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
          class_id?: string
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
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      live_trades: {
        Row: {
          commission: number
          contracts: number
          created_at: string
          direction: string
          entry_price: number | null
          gross_pnl: number | null
          id: string
          net_pnl: number | null
          opened_at: string
          result: string | null
          strategy: string | null
          ticks: number | null
          trading_session_id: string
          user_id: string
        }
        Insert: {
          commission?: number
          contracts?: number
          created_at?: string
          direction: string
          entry_price?: number | null
          gross_pnl?: number | null
          id?: string
          net_pnl?: number | null
          opened_at?: string
          result?: string | null
          strategy?: string | null
          ticks?: number | null
          trading_session_id: string
          user_id: string
        }
        Update: {
          commission?: number
          contracts?: number
          created_at?: string
          direction?: string
          entry_price?: number | null
          gross_pnl?: number | null
          id?: string
          net_pnl?: number | null
          opened_at?: string
          result?: string | null
          strategy?: string | null
          ticks?: number | null
          trading_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_trades_trading_session_id_fkey"
            columns: ["trading_session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          avatar_url: string | null
          completed_modules: string[] | null
          created_at: string
          display_name: string | null
          id: string
          plan_state: string
          referral_source: string | null
          referred_by_guru_id: string | null
          role: string
          stripe_customer_id: string | null
          tier_state: string
          tos_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_verified?: boolean | null
          avatar_url?: string | null
          completed_modules?: string[] | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_state?: string
          referral_source?: string | null
          referred_by_guru_id?: string | null
          role?: string
          stripe_customer_id?: string | null
          tier_state?: string
          tos_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_verified?: boolean | null
          avatar_url?: string | null
          completed_modules?: string[] | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan_state?: string
          referral_source?: string | null
          referred_by_guru_id?: string | null
          role?: string
          stripe_customer_id?: string | null
          tier_state?: string
          tos_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_guru_id_fkey"
            columns: ["referred_by_guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_guru_id_fkey"
            columns: ["referred_by_guru_id"]
            isOneToOne: false
            referencedRelation: "guru_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          passed: boolean
          quiz_id: string
          responses: Json
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          responses?: Json
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          responses?: Json
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          author_id: string | null
          content_type: string
          created_at: string
          id: string
          is_published: boolean | null
          lesson_id: string | null
          module: string
          pass_threshold: number
          questions: Json
          title: string
        }
        Insert: {
          author_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          lesson_id?: string | null
          module: string
          pass_threshold?: number
          questions?: Json
          title: string
        }
        Update: {
          author_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          lesson_id?: string | null
          module?: string
          pass_threshold?: number
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          atr_length: number | null
          atr_multiplier: number | null
          atr_timeframe: string | null
          breakeven_r: number | null
          breakout_threshold: number | null
          created_at: string | null
          description: string | null
          direction_bias: string | null
          entry_method: string | null
          entry_rules: string | null
          eod_flat_time: string | null
          exit_rules: string | null
          filters: Json | null
          id: string
          indicator_set: Json | null
          instrument: string | null
          is_system: boolean | null
          limit_order_placement: number | null
          max_contracts: number | null
          max_long_per_day: number | null
          max_losses_per_day: number | null
          max_short_per_day: number | null
          max_wins_per_day: number | null
          name: string
          notes: string | null
          range_end_time: string | null
          range_start_time: string | null
          range_stop_loss_pct: number | null
          retest_entry_type: string | null
          retest_stop_method: string | null
          risk_per_trade: number | null
          skip_holidays: boolean | null
          source: string
          stop_loss_ticks: number | null
          take_profit_r: number | null
          tier_required: string | null
          timeframe: string | null
          timezone: string | null
          trade_end_time: string | null
          trade_start_time: string | null
          trailing_activate_r: number | null
          trailing_stop_enabled: boolean | null
          use_breakout_candle_sl: boolean | null
          user_id: string | null
        }
        Insert: {
          atr_length?: number | null
          atr_multiplier?: number | null
          atr_timeframe?: string | null
          breakeven_r?: number | null
          breakout_threshold?: number | null
          created_at?: string | null
          description?: string | null
          direction_bias?: string | null
          entry_method?: string | null
          entry_rules?: string | null
          eod_flat_time?: string | null
          exit_rules?: string | null
          filters?: Json | null
          id?: string
          indicator_set?: Json | null
          instrument?: string | null
          is_system?: boolean | null
          limit_order_placement?: number | null
          max_contracts?: number | null
          max_long_per_day?: number | null
          max_losses_per_day?: number | null
          max_short_per_day?: number | null
          max_wins_per_day?: number | null
          name: string
          notes?: string | null
          range_end_time?: string | null
          range_start_time?: string | null
          range_stop_loss_pct?: number | null
          retest_entry_type?: string | null
          retest_stop_method?: string | null
          risk_per_trade?: number | null
          skip_holidays?: boolean | null
          source?: string
          stop_loss_ticks?: number | null
          take_profit_r?: number | null
          tier_required?: string | null
          timeframe?: string | null
          timezone?: string | null
          trade_end_time?: string | null
          trade_start_time?: string | null
          trailing_activate_r?: number | null
          trailing_stop_enabled?: boolean | null
          use_breakout_candle_sl?: boolean | null
          user_id?: string | null
        }
        Update: {
          atr_length?: number | null
          atr_multiplier?: number | null
          atr_timeframe?: string | null
          breakeven_r?: number | null
          breakout_threshold?: number | null
          created_at?: string | null
          description?: string | null
          direction_bias?: string | null
          entry_method?: string | null
          entry_rules?: string | null
          eod_flat_time?: string | null
          exit_rules?: string | null
          filters?: Json | null
          id?: string
          indicator_set?: Json | null
          instrument?: string | null
          is_system?: boolean | null
          limit_order_placement?: number | null
          max_contracts?: number | null
          max_long_per_day?: number | null
          max_losses_per_day?: number | null
          max_short_per_day?: number | null
          max_wins_per_day?: number | null
          name?: string
          notes?: string | null
          range_end_time?: string | null
          range_start_time?: string | null
          range_stop_loss_pct?: number | null
          retest_entry_type?: string | null
          retest_stop_method?: string | null
          risk_per_trade?: number | null
          skip_holidays?: boolean | null
          source?: string
          stop_loss_ticks?: number | null
          take_profit_r?: number | null
          tier_required?: string | null
          timeframe?: string | null
          timezone?: string | null
          trade_end_time?: string | null
          trade_start_time?: string | null
          trailing_activate_r?: number | null
          trailing_stop_enabled?: boolean | null
          use_breakout_candle_sl?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      strategy_extractions: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_json: Json | null
          id: string
          saved_strategy_id: string | null
          source_text: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_json?: Json | null
          id?: string
          saved_strategy_id?: string | null
          source_text: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_json?: Json | null
          id?: string
          saved_strategy_id?: string | null
          source_text?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_extractions_saved_strategy_id_fkey"
            columns: ["saved_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_playback_scenarios: {
        Row: {
          annotations: Json
          confirmation_bar_index: number
          created_at: string
          description: string | null
          direction: string
          entry_bar_index: number
          entry_price: number
          exit_bar_index: number
          exit_price: number
          id: string
          indicator_tags: string[]
          instrument: string
          is_active: boolean
          name: string
          ohlcv_data: Json
          result_points: number
          setup_bar_index: number
          stop_price: number
          target_price: number
          timeframe: string
        }
        Insert: {
          annotations?: Json
          confirmation_bar_index: number
          created_at?: string
          description?: string | null
          direction?: string
          entry_bar_index: number
          entry_price: number
          exit_bar_index: number
          exit_price: number
          id?: string
          indicator_tags?: string[]
          instrument?: string
          is_active?: boolean
          name: string
          ohlcv_data: Json
          result_points: number
          setup_bar_index: number
          stop_price: number
          target_price: number
          timeframe?: string
        }
        Update: {
          annotations?: Json
          confirmation_bar_index?: number
          created_at?: string
          description?: string | null
          direction?: string
          entry_bar_index?: number
          entry_price?: number
          exit_bar_index?: number
          exit_price?: number
          id?: string
          indicator_tags?: string[]
          instrument?: string
          is_active?: boolean
          name?: string
          ohlcv_data?: Json
          result_points?: number
          setup_bar_index?: number
          stop_price?: number
          target_price?: number
          timeframe?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          checklist_session_id: string | null
          closed_at: string | null
          commission: number | null
          contracts: number | null
          created_at: string | null
          direction: string | null
          entry_price: number | null
          exit_price: number | null
          gross_pnl: number | null
          id: string
          net_pnl: number | null
          notes: string | null
          opened_at: string | null
          pnl: number | null
          pnl_ticks: number | null
          result: string | null
          session_type: string | null
          steps_completed: number[] | null
          stop_loss: number | null
          strategy: string | null
          symbol: string | null
          take_profit: number | null
          ticks: number | null
          timeframe: string | null
          trading_session_id: string | null
          user_id: string
        }
        Insert: {
          checklist_session_id?: string | null
          closed_at?: string | null
          commission?: number | null
          contracts?: number | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          gross_pnl?: number | null
          id?: string
          net_pnl?: number | null
          notes?: string | null
          opened_at?: string | null
          pnl?: number | null
          pnl_ticks?: number | null
          result?: string | null
          session_type?: string | null
          steps_completed?: number[] | null
          stop_loss?: number | null
          strategy?: string | null
          symbol?: string | null
          take_profit?: number | null
          ticks?: number | null
          timeframe?: string | null
          trading_session_id?: string | null
          user_id: string
        }
        Update: {
          checklist_session_id?: string | null
          closed_at?: string | null
          commission?: number | null
          contracts?: number | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          gross_pnl?: number | null
          id?: string
          net_pnl?: number | null
          notes?: string | null
          opened_at?: string | null
          pnl?: number | null
          pnl_ticks?: number | null
          result?: string | null
          session_type?: string | null
          steps_completed?: number[] | null
          stop_loss?: number | null
          strategy?: string | null
          symbol?: string | null
          take_profit?: number | null
          ticks?: number | null
          timeframe?: string | null
          trading_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_checklist_session_id_fkey"
            columns: ["checklist_session_id"]
            isOneToOne: false
            referencedRelation: "checklist_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_trading_session_id_fkey"
            columns: ["trading_session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_sessions: {
        Row: {
          checklist_session_id: string | null
          cost_per_trade: number
          created_at: string | null
          daily_data_fee: number
          date: string
          ended_at: string | null
          id: string
          max_consecutive_losses: number | null
          max_contracts: number | null
          max_daily_loss: number | null
          planned_trades: number | null
          started_at: string
          status: string
          tick_value: number
          user_id: string
        }
        Insert: {
          checklist_session_id?: string | null
          cost_per_trade?: number
          created_at?: string | null
          daily_data_fee?: number
          date?: string
          ended_at?: string | null
          id?: string
          max_consecutive_losses?: number | null
          max_contracts?: number | null
          max_daily_loss?: number | null
          planned_trades?: number | null
          started_at?: string
          status?: string
          tick_value?: number
          user_id: string
        }
        Update: {
          checklist_session_id?: string | null
          cost_per_trade?: number
          created_at?: string | null
          daily_data_fee?: number
          date?: string
          ended_at?: string | null
          id?: string
          max_consecutive_losses?: number | null
          max_contracts?: number | null
          max_daily_loss?: number | null
          planned_trades?: number | null
          started_at?: string
          status?: string
          tick_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_sessions_checklist_session_id_fkey"
            columns: ["checklist_session_id"]
            isOneToOne: false
            referencedRelation: "checklist_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      guru_profiles_public: {
        Row: {
          bio: string | null
          id: string | null
          is_public: boolean | null
          primary_instrument: string | null
          primary_strategy: string | null
          status: string | null
          tagline: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          id?: string | null
          is_public?: boolean | null
          primary_instrument?: string | null
          primary_strategy?: string | null
          status?: string | null
          tagline?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          id?: string | null
          is_public?: boolean | null
          primary_instrument?: string | null
          primary_strategy?: string | null
          status?: string | null
          tagline?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_terms: {
        Args: { p_age_verified?: boolean; p_tos_accepted?: boolean }
        Returns: undefined
      }
      admin_approve_guru: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_reject_guru: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_update_user_plan: {
        Args: { new_plan_state: string; target_user_id: string }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
      get_admin_detailed_stats: { Args: never; Returns: Json }
      get_admin_guru_applications: {
        Args: never
        Returns: {
          application_id: string
          created_at: string
          display_name: string
          email: string
          existing_presence: string
          plan_state: string
          status: string
          trading_style: string
          user_id: string
          what_you_teach: string
          years_experience: string
        }[]
      }
      get_admin_overview_stats: { Args: never; Returns: Json }
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          plan_state: string
          role: string
          strategy_count: number
          tier_state: string
          trade_count: number
          user_id: string
        }[]
      }
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
          checklist_session_id: string | null
          closed_at: string | null
          commission: number | null
          contracts: number | null
          created_at: string | null
          direction: string | null
          entry_price: number | null
          exit_price: number | null
          gross_pnl: number | null
          id: string
          net_pnl: number | null
          notes: string | null
          opened_at: string | null
          pnl: number | null
          pnl_ticks: number | null
          result: string | null
          session_type: string | null
          steps_completed: number[] | null
          stop_loss: number | null
          strategy: string | null
          symbol: string | null
          take_profit: number | null
          ticks: number | null
          timeframe: string | null
          trading_session_id: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trades"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_investor_kpis: { Args: never; Returns: Json }
      get_profiles_by_user_ids: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
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
      get_user_role: { Args: never; Returns: string }
      guru_has_student: { Args: { _student_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      promote_tier: { Args: { target_tier: string }; Returns: Json }
      seed_default_checklists: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      student_is_enrolled_in_class: {
        Args: { _class_id: string }
        Returns: boolean
      }
      sync_plan_state: {
        Args: {
          p_plan_state: string
          p_stripe_customer_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
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
