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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analysis_requests: {
        Row: {
          constraint_key: string
          id: string
          passage_id: string
          requested_at: string
          user_id: string
        }
        Insert: {
          constraint_key: string
          id?: string
          passage_id: string
          requested_at?: string
          user_id: string
        }
        Update: {
          constraint_key?: string
          id?: string
          passage_id?: string
          requested_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          passages_practiced: number
          sessions: number
          stat_date: string
          user_id: string
          words_written: number
        }
        Insert: {
          passages_practiced?: number
          sessions?: number
          stat_date: string
          user_id: string
          words_written?: number
        }
        Update: {
          passages_practiced?: number
          sessions?: number
          stat_date?: string
          user_id?: string
          words_written?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passage_analyses: {
        Row: {
          analysis: Json
          constraint_key: string
          created_at: string
          id: string
          passage_id: string
        }
        Insert: {
          analysis: Json
          constraint_key: string
          created_at?: string
          id?: string
          passage_id: string
        }
        Update: {
          analysis?: Json
          constraint_key?: string
          created_at?: string
          id?: string
          passage_id?: string
        }
        Relationships: []
      }
      passage_completions: {
        Row: {
          completed_at: string
          constraint_key: string
          feedback: Json | null
          id: string
          passage_id: string
          user_id: string
          user_text: string | null
          word_count: number | null
        }
        Insert: {
          completed_at?: string
          constraint_key: string
          feedback?: Json | null
          id?: string
          passage_id: string
          user_id: string
          user_text?: string | null
          word_count?: number | null
        }
        Update: {
          completed_at?: string
          constraint_key?: string
          feedback?: Json | null
          id?: string
          passage_id?: string
          user_id?: string
          user_text?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "passage_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passage_pack_items: {
        Row: {
          pack_id: string
          passage_id: string
        }
        Insert: {
          pack_id: string
          passage_id: string
        }
        Update: {
          pack_id?: string
          passage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passage_pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "passage_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      passage_packs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          price_cents: number
          pro_only: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          label: string
          price_cents?: number
          pro_only?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          price_cents?: number
          pro_only?: boolean
        }
        Relationships: []
      }
      plans: {
        Row: {
          extract_access: string
          has_custom_voice: boolean
          has_playground: boolean
          id: string
          label: string
          price_monthly_cents: number
          stripe_lookup_key: string | null
          weekly_analysis_limit: number | null
        }
        Insert: {
          extract_access: string
          has_custom_voice?: boolean
          has_playground?: boolean
          id: string
          label: string
          price_monthly_cents?: number
          stripe_lookup_key?: string | null
          weekly_analysis_limit?: number | null
        }
        Update: {
          extract_access?: string
          has_custom_voice?: boolean
          has_playground?: boolean
          id?: string
          label?: string
          price_monthly_cents?: number
          stripe_lookup_key?: string | null
          weekly_analysis_limit?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          email_reminders: boolean
          goal: string | null
          id: string
          last_active_date: string | null
          longest_streak: number
          preferred_categories: string[]
          preferred_difficulty: string | null
          preferred_length: string | null
          preferred_tags: string[]
          show_streak_badge: boolean
          total_passages_done: number
          total_sessions: number
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          current_streak?: number
          email_reminders?: boolean
          goal?: string | null
          id: string
          last_active_date?: string | null
          longest_streak?: number
          preferred_categories?: string[]
          preferred_difficulty?: string | null
          preferred_length?: string | null
          preferred_tags?: string[]
          show_streak_badge?: boolean
          total_passages_done?: number
          total_sessions?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          current_streak?: number
          email_reminders?: boolean
          goal?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          preferred_categories?: string[]
          preferred_difficulty?: string | null
          preferred_length?: string | null
          preferred_tags?: string[]
          show_streak_badge?: boolean
          total_passages_done?: number
          total_sessions?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_rewrites: {
        Row: {
          constraint_key: string
          created_at: string
          id: string
          is_favorite: boolean
          note: string | null
          passage_id: string
          rewrite_text: string
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          constraint_key: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          note?: string | null
          passage_id: string
          rewrite_text: string
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          constraint_key?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          note?: string | null
          passage_id?: string
          rewrite_text?: string
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_rewrites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pack_access: {
        Row: {
          pack_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          pack_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          pack_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pack_access_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "passage_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pack_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_category: {
        Args: { p_category_id: string; p_user_id: string }
        Returns: boolean
      }
      can_request_analysis: { Args: { p_user_id: string }; Returns: Json }
      get_free_category_ids: { Args: never; Returns: string[] }
      get_user_entitlements: { Args: { p_user_id: string }; Returns: Json }
      get_user_plan: { Args: { p_user_id: string }; Returns: string }
      record_analysis_request: {
        Args: {
          p_constraint_key: string
          p_passage_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      record_session_completion:
        | {
            Args: { p_passage_id: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_passage_id: string
              p_user_id: string
              p_word_count?: number
            }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
