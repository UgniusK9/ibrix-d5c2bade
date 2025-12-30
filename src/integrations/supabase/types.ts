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
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          meta_json: Json | null
          product_id: string
          quantity: number
          type: Database["public"]["Enums"]["cart_item_type"]
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          meta_json?: Json | null
          product_id: string
          quantity?: number
          type: Database["public"]["Enums"]["cart_item_type"]
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          meta_json?: Json | null
          product_id?: string
          quantity?: number
          type?: Database["public"]["Enums"]["cart_item_type"]
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          preorder_eta_weeks_snapshot: number | null
          product_id: string
          quantity: number
          title_snapshot: string
          type: Database["public"]["Enums"]["cart_item_type"]
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          preorder_eta_weeks_snapshot?: number | null
          product_id: string
          quantity: number
          title_snapshot: string
          type: Database["public"]["Enums"]["cart_item_type"]
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          preorder_eta_weeks_snapshot?: number | null
          product_id?: string
          quantity?: number
          title_snapshot?: string
          type?: Database["public"]["Enums"]["cart_item_type"]
          unit_price_cents?: number
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
          created_at: string
          currency: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_intent_id: string | null
          payment_provider: string | null
          phone: string | null
          shipping_address_json: Json
          shipping_cents: number
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_provider?: string | null
          phone?: string | null
          shipping_address_json?: Json
          shipping_cents?: number
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_provider?: string | null
          phone?: string | null
          shipping_address_json?: Json
          shipping_cents?: number
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          currency: string
          details_json: Json | null
          id: string
          image_url: string | null
          inventory_qty: number | null
          is_active: boolean
          preorder_eta_weeks: number | null
          price_cents: number
          short_desc: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          details_json?: Json | null
          id?: string
          image_url?: string | null
          inventory_qty?: number | null
          is_active?: boolean
          preorder_eta_weeks?: number | null
          price_cents: number
          short_desc?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          details_json?: Json | null
          id?: string
          image_url?: string | null
          inventory_qty?: number | null
          is_active?: boolean
          preorder_eta_weeks?: number | null
          price_cents?: number
          short_desc?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          carrier_event_id: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          occurred_at: string
          shipment_id: string
          source: Database["public"]["Enums"]["event_source"]
          status_code: string
        }
        Insert: {
          carrier_event_id?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          occurred_at?: string
          shipment_id: string
          source?: Database["public"]["Enums"]["event_source"]
          status_code: string
        }
        Update: {
          carrier_event_id?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          occurred_at?: string
          shipment_id?: string
          source?: Database["public"]["Enums"]["event_source"]
          status_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier_code: Database["public"]["Enums"]["carrier_code"]
          created_at: string
          delivered_at: string | null
          id: string
          last_carrier_sync_at: string | null
          order_id: string
          packed_at: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier_code: Database["public"]["Enums"]["carrier_code"]
          created_at?: string
          delivered_at?: string | null
          id?: string
          last_carrier_sync_at?: string | null
          order_id: string
          packed_at?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier_code?: Database["public"]["Enums"]["carrier_code"]
          created_at?: string
          delivered_at?: string | null
          id?: string
          last_carrier_sync_at?: string | null
          order_id?: string
          packed_at?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          order_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_tokens_order_id_fkey"
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
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      carrier_code: "omniva" | "lp_express" | "dpd" | "courier" | "other"
      cart_item_type: "in_stock" | "pre_order"
      event_source: "internal" | "carrier"
      order_status:
        | "draft"
        | "pending_payment"
        | "paid"
        | "cancelled"
        | "refunded"
        | "failed"
      product_status: "in_stock" | "pre_order"
      shipment_status:
        | "pending"
        | "packed"
        | "shipped"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "exception"
      shipping_method:
        | "omniva_locker"
        | "lp_express_locker"
        | "dpd_locker"
        | "courier"
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
      carrier_code: ["omniva", "lp_express", "dpd", "courier", "other"],
      cart_item_type: ["in_stock", "pre_order"],
      event_source: ["internal", "carrier"],
      order_status: [
        "draft",
        "pending_payment",
        "paid",
        "cancelled",
        "refunded",
        "failed",
      ],
      product_status: ["in_stock", "pre_order"],
      shipment_status: [
        "pending",
        "packed",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
      ],
      shipping_method: [
        "omniva_locker",
        "lp_express_locker",
        "dpd_locker",
        "courier",
      ],
    },
  },
} as const
