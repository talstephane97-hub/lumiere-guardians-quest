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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      keys_collected: {
        Row: {
          collected_at: string
          id: string
          key_type: string
          user_id: string
        }
        Insert: {
          collected_at?: string
          id?: string
          key_type: string
          user_id: string
        }
        Update: {
          collected_at?: string
          id?: string
          key_type?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_configs: {
        Row: {
          ai_validation_prompt: string | null
          code_verb: string | null
          code_verb_lang: string | null
          day: number
          location_lat: number | null
          location_lng: number | null
          mission_id: string
          order_index: number
          radius_meters: number | null
          requires_photo: boolean | null
          target_lat: number | null
          target_lng: number | null
          title: string
          validation_type: string | null
        }
        Insert: {
          ai_validation_prompt?: string | null
          code_verb?: string | null
          code_verb_lang?: string | null
          day: number
          location_lat?: number | null
          location_lng?: number | null
          mission_id: string
          order_index: number
          radius_meters?: number | null
          requires_photo?: boolean | null
          target_lat?: number | null
          target_lng?: number | null
          title: string
          validation_type?: string | null
        }
        Update: {
          ai_validation_prompt?: string | null
          code_verb?: string | null
          code_verb_lang?: string | null
          day?: number
          location_lat?: number | null
          location_lng?: number | null
          mission_id?: string
          order_index?: number
          radius_meters?: number | null
          requires_photo?: boolean | null
          target_lat?: number | null
          target_lng?: number | null
          title?: string
          validation_type?: string | null
        }
        Relationships: []
      }
      missions_progress: {
        Row: {
          completed: boolean | null
          created_at: string
          day: number
          id: string
          mission_id: string
          proof_url: string | null
          user_id: string
          validated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          day: number
          id?: string
          mission_id: string
          proof_url?: string | null
          user_id: string
          validated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          day?: number
          id?: string
          mission_id?: string
          proof_url?: string | null
          user_id?: string
          validated_at?: string | null
        }
        Relationships: []
      }
      player_positions: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          mission_context: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          mission_context?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          mission_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string | null
          team_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          language?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regenerative_actions: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          ai_validation_result: string | null
          code_verb_entered: string | null
          created_at: string
          distance_from_target: number | null
          id: string
          latitude: number | null
          location_valid: boolean | null
          longitude: number | null
          mission_id: string
          notes: string | null
          photo_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_validation_result?: string | null
          code_verb_entered?: string | null
          created_at?: string
          distance_from_target?: number | null
          id?: string
          latitude?: number | null
          location_valid?: boolean | null
          longitude?: number | null
          mission_id: string
          notes?: string | null
          photo_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_validation_result?: string | null
          code_verb_entered?: string | null
          created_at?: string
          distance_from_target?: number | null
          id?: string
          latitude?: number | null
          location_valid?: boolean | null
          longitude?: number | null
          mission_id?: string
          notes?: string | null
          photo_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string | null
          type?: string
          updated_at?: string
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
