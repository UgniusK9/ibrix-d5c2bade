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
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
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
          anonymous_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          properties: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_targets: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          segment_key: Database["public"]["Enums"]["segment_key"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          segment_key?: Database["public"]["Enums"]["segment_key"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          segment_key?: Database["public"]["Enums"]["segment_key"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_targets_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          starts_at: string | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          category_snapshot: Database["public"]["Enums"]["product_category"]
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          sku_snapshot: string
          title_snapshot: string
          unit_deposit_eur: number
          unit_price_eur: number
        }
        Insert: {
          category_snapshot: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          sku_snapshot: string
          title_snapshot: string
          unit_deposit_eur: number
          unit_price_eur: number
        }
        Update: {
          category_snapshot?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          sku_snapshot?: string
          title_snapshot?: string
          unit_deposit_eur?: number
          unit_price_eur?: number
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
          balance_paid_at: string | null
          balance_total_eur: number
          created_at: string
          currency: string
          deposit_total_eur: number
          discount_eur: number
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_plan: Database["public"]["Enums"]["payment_plan"]
          phone: string | null
          preorder_eta_weeks_max: number | null
          preorder_eta_weeks_min: number | null
          preorder_flag: boolean
          shipping_address_json: Json
          shipping_eur: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_eur: number
          total_eur: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance_paid_at?: string | null
          balance_total_eur: number
          created_at?: string
          currency?: string
          deposit_total_eur: number
          discount_eur?: number
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_plan?: Database["public"]["Enums"]["payment_plan"]
          phone?: string | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          preorder_flag?: boolean
          shipping_address_json?: Json
          shipping_eur?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_eur: number
          total_eur: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance_paid_at?: string | null
          balance_total_eur?: number
          created_at?: string
          currency?: string
          deposit_total_eur?: number
          discount_eur?: number
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_plan?: Database["public"]["Enums"]["payment_plan"]
          phone?: string | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          preorder_flag?: boolean
          shipping_address_json?: Json
          shipping_eur?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_eur?: number
          total_eur?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_eur: number
          created_at: string
          id: string
          order_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_event_id: string | null
          stripe_payment_intent_id: string | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount_eur: number
          created_at?: string
          id?: string
          order_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_event_id?: string | null
          stripe_payment_intent_id?: string | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount_eur?: number
          created_at?: string
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_event_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          deposit_eur: number
          description: string | null
          details_json: Json | null
          id: string
          images: Json
          inventory_qty: number | null
          preorder_eta_weeks_max: number | null
          preorder_eta_weeks_min: number | null
          price_eur: number
          short_desc: string | null
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_status: Database["public"]["Enums"]["stock_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          deposit_eur: number
          description?: string | null
          details_json?: Json | null
          id?: string
          images?: Json
          inventory_qty?: number | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          price_eur: number
          short_desc?: string | null
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_status?: Database["public"]["Enums"]["stock_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          deposit_eur?: number
          description?: string | null
          details_json?: Json | null
          id?: string
          images?: Json
          inventory_qty?: number | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          price_eur?: number
          short_desc?: string | null
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_status?: Database["public"]["Enums"]["stock_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          id: string
          offer_id: string
          order_id: string | null
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          order_id?: string | null
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          anonymous_id: string
          first_seen_at: string
          id: string
          ip_hash: string | null
          last_seen_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          first_seen_at?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          first_seen_at?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          carrier_event_id: string | null
          created_at: string
          description: string
          id: string
          lat: number | null
          lng: number | null
          location_label: string | null
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
          lat?: number | null
          lng?: number | null
          location_label?: string | null
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
          lat?: number | null
          lng?: number | null
          location_label?: string | null
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
          carrier_code: Database["public"]["Enums"]["carrier_code"] | null
          created_at: string
          delivered_at: string | null
          id: string
          last_sync_at: string | null
          order_id: string
          packed_at: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          tracking_token: string
          updated_at: string
        }
        Insert: {
          carrier_code?: Database["public"]["Enums"]["carrier_code"] | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          last_sync_at?: string | null
          order_id: string
          packed_at?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          carrier_code?: Database["public"]["Enums"]["carrier_code"] | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          last_sync_at?: string | null
          order_id?: string
          packed_at?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          tracking_token?: string
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
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string | null
          payload_summary: Json | null
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id?: string | null
          payload_summary?: Json | null
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload_summary?: Json | null
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "customer"
      carrier_code: "omniva" | "lp_express" | "dpd" | "other"
      event_source: "internal" | "carrier"
      offer_type: "percent" | "fixed"
      order_status:
        | "created"
        | "deposit_paid"
        | "awaiting_balance"
        | "balance_paid"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_plan: "deposit_only" | "full_payment"
      payment_status: "pending" | "succeeded" | "failed"
      payment_type: "deposit" | "balance" | "refund"
      product_category: "engines" | "cars" | "flowers" | "other"
      product_status: "active" | "inactive"
      segment_key: "CART_ABANDONER" | "HIGH_INTENT" | "RETURNING" | "NEW_USER"
      shipment_status:
        | "pending"
        | "packed"
        | "shipped"
        | "in_transit"
        | "delivered"
      stock_status: "preorder" | "in_stock" | "out_of_stock"
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
      app_role: ["admin", "customer"],
      carrier_code: ["omniva", "lp_express", "dpd", "other"],
      event_source: ["internal", "carrier"],
      offer_type: ["percent", "fixed"],
      order_status: [
        "created",
        "deposit_paid",
        "awaiting_balance",
        "balance_paid",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_plan: ["deposit_only", "full_payment"],
      payment_status: ["pending", "succeeded", "failed"],
      payment_type: ["deposit", "balance", "refund"],
      product_category: ["engines", "cars", "flowers", "other"],
      product_status: ["active", "inactive"],
      segment_key: ["CART_ABANDONER", "HIGH_INTENT", "RETURNING", "NEW_USER"],
      shipment_status: [
        "pending",
        "packed",
        "shipped",
        "in_transit",
        "delivered",
      ],
      stock_status: ["preorder", "in_stock", "out_of_stock"],
    },
  },
} as const
