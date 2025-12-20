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
      bag: {
        Row: {
          bean_id: string
          created_at: string
          id: string
          modified_at: string
          name: string | null
          owner_id: string
          price: number | null
          purchase_location: string | null
          roast_date: string | null
          weight_g: number | null
        }
        Insert: {
          bean_id: string
          created_at?: string
          id?: string
          modified_at?: string
          name?: string | null
          owner_id: string
          price?: number | null
          purchase_location?: string | null
          roast_date?: string | null
          weight_g?: number | null
        }
        Update: {
          bean_id?: string
          created_at?: string
          id?: string
          modified_at?: string
          name?: string | null
          owner_id?: string
          price?: number | null
          purchase_location?: string | null
          roast_date?: string | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bag_bean_id_fkey"
            columns: ["bean_id"]
            isOneToOne: false
            referencedRelation: "bean"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bag_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "barista"
            referencedColumns: ["id"]
          },
        ]
      }
      barista: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          first_name: string
          id: string
          is_admin: boolean
          last_name: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          first_name: string
          id: string
          is_admin?: boolean
          last_name: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          first_name?: string
          id?: string
          is_admin?: boolean
          last_name?: string
        }
        Relationships: []
      }
      bean: {
        Row: {
          country_of_origin: string | null
          created_at: string
          id: string
          modified_at: string
          name: string
          roast_level: Database["public"]["Enums"]["roast_levels"]
          roaster_id: string | null
          tasting_notes: string | null
        }
        Insert: {
          country_of_origin?: string | null
          created_at?: string
          id?: string
          modified_at?: string
          name: string
          roast_level: Database["public"]["Enums"]["roast_levels"]
          roaster_id?: string | null
          tasting_notes?: string | null
        }
        Update: {
          country_of_origin?: string | null
          created_at?: string
          id?: string
          modified_at?: string
          name?: string
          roast_level?: Database["public"]["Enums"]["roast_levels"]
          roaster_id?: string | null
          tasting_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bean_roaster_id_fkey"
            columns: ["roaster_id"]
            isOneToOne: false
            referencedRelation: "roaster"
            referencedColumns: ["id"]
          },
        ]
      }
      brew: {
        Row: {
          bag_id: string
          barista_id: string
          brew_time_s: number | null
          created_at: string
          dose_g: number
          flow_rate_g_per_s: number | null
          grind_setting: string | null
          grinder_id: string
          id: string
          machine_id: string
          modified_at: string
          name: string
          rating: number | null
          ratio: number | null
          reflections: string | null
          tasting_notes: string | null
          yield_g: number | null
        }
        Insert: {
          bag_id: string
          barista_id: string
          brew_time_s?: number | null
          created_at?: string
          dose_g: number
          flow_rate_g_per_s?: number | null
          grind_setting?: string | null
          grinder_id: string
          id?: string
          machine_id: string
          modified_at?: string
          name: string
          rating?: number | null
          ratio?: number | null
          reflections?: string | null
          tasting_notes?: string | null
          yield_g?: number | null
        }
        Update: {
          bag_id?: string
          barista_id?: string
          brew_time_s?: number | null
          created_at?: string
          dose_g?: number
          flow_rate_g_per_s?: number | null
          grind_setting?: string | null
          grinder_id?: string
          id?: string
          machine_id?: string
          modified_at?: string
          name?: string
          rating?: number | null
          ratio?: number | null
          reflections?: string | null
          tasting_notes?: string | null
          yield_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brew_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "bag"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brew_barista_id_fkey"
            columns: ["barista_id"]
            isOneToOne: false
            referencedRelation: "barista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brew_grinder_id_fkey"
            columns: ["grinder_id"]
            isOneToOne: false
            referencedRelation: "grinder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brew_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machine"
            referencedColumns: ["id"]
          },
        ]
      }
      grinder: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          manufacturer: string | null
          modified_at: string | null
          name: string
          setting_guide_chart_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          manufacturer?: string | null
          modified_at?: string | null
          name: string
          setting_guide_chart_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          manufacturer?: string | null
          modified_at?: string | null
          name?: string
          setting_guide_chart_url?: string | null
        }
        Relationships: []
      }
      machine: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          manufacturer: string | null
          modified_at: string
          name: string
          user_manual_link: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          manufacturer?: string | null
          modified_at?: string
          name: string
          user_manual_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          manufacturer?: string | null
          modified_at?: string
          name?: string
          user_manual_link?: string | null
        }
        Relationships: []
      }
      roaster: {
        Row: {
          created_at: string
          id: string
          modified_at: string
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          modified_at?: string
          name: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          modified_at?: string
          name?: string
          website_url?: string | null
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
      roast_levels: "Dark" | "Medium Dark" | "Medium" | "Medium Light" | "Light"
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
    Enums: {
      roast_levels: ["Dark", "Medium Dark", "Medium", "Medium Light", "Light"],
    },
  },
} as const
