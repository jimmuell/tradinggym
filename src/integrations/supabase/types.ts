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
      [_ in never]: never
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
