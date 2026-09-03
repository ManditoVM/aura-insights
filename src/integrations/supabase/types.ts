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
      ai_insights: {
        Row: {
          body: string
          confidence: number | null
          data: Json
          generated_at: string
          id: string
          product_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string
          title: string
          type: Database["public"]["Enums"]["insight_type"]
        }
        Insert: {
          body: string
          confidence?: number | null
          data?: Json
          generated_at?: string
          id?: string
          product_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string
          title: string
          type: Database["public"]["Enums"]["insight_type"]
        }
        Update: {
          body?: string
          confidence?: number | null
          data?: Json
          generated_at?: string
          id?: string
          product_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string
          title?: string
          type?: Database["public"]["Enums"]["insight_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          message: string
          read: boolean
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
        }
        Insert: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          message: string
          read?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
        }
        Update: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          message?: string
          read?: boolean
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          stock_after: number
          stock_before: number
          type: Database["public"]["Enums"]["movement_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          stock_after?: number
          stock_before?: number
          type: Database["public"]["Enums"]["movement_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          stock_after?: number
          stock_before?: number
          type?: Database["public"]["Enums"]["movement_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          code: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          payment_method: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          code?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          payment_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          code?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          payment_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence: number | null
          estimated_demand: number
          generated_at: string
          horizon_days: number
          id: string
          method: string
          product_id: string
          trend: string
        }
        Insert: {
          confidence?: number | null
          estimated_demand: number
          generated_at?: string
          horizon_days?: number
          id?: string
          method?: string
          product_id: string
          trend?: string
        }
        Update: {
          confidence?: number | null
          estimated_demand?: number
          generated_at?: string
          horizon_days?: number
          id?: string
          method?: string
          product_id?: string
          trend?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          category_id: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          max_stock: number
          min_stock: number
          name: string
          price: number
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_stock?: number
          min_stock?: number
          name: string
          price?: number
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_stock?: number
          min_stock?: number
          name?: string
          price?: number
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          order_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      confirm_order: {
        Args: { _order_id: string }
        Returns: {
          code: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          payment_method: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      register_movement: {
        Args: {
          _order_id?: string
          _product_id: string
          _quantity: number
          _reason?: string
          _reference?: string
          _type: Database["public"]["Enums"]["movement_type"]
        }
        Returns: string
      }
    }
    Enums: {
      alert_severity: "info" | "success" | "warning" | "critical" | "insight"
      app_role: "admin" | "employee" | "customer"
      insight_type:
        | "riesgo_agotamiento"
        | "baja_rotacion"
        | "alta_demanda"
        | "anomalia"
        | "recomendacion"
        | "resumen"
      movement_type: "entrada" | "salida" | "ajuste"
      order_status:
        | "pendiente"
        | "confirmado"
        | "preparando"
        | "enviado"
        | "entregado"
        | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      alert_severity: ["info", "success", "warning", "critical", "insight"],
      app_role: ["admin", "employee", "customer"],
      insight_type: [
        "riesgo_agotamiento",
        "baja_rotacion",
        "alta_demanda",
        "anomalia",
        "recomendacion",
        "resumen",
      ],
      movement_type: ["entrada", "salida", "ajuste"],
      order_status: [
        "pendiente",
        "confirmado",
        "preparando",
        "enviado",
        "entregado",
        "cancelado",
      ],
    },
  },
} as const
