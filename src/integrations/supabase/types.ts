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
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      balance_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          order_id: string
          payment_url: string | null
          requested_by_user_id: string | null
          sent_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          order_id: string
          payment_url?: string | null
          requested_by_user_id?: string | null
          sent_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string
          payment_url?: string | null
          requested_by_user_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_rules: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount_category: string | null
          discount_product_id: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          max_uses: number | null
          name: string
          starts_at: string | null
          trigger_category: string | null
          trigger_min_qty: number
          trigger_product_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_category?: string | null
          discount_product_id?: string | null
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          name: string
          starts_at?: string | null
          trigger_category?: string | null
          trigger_min_qty?: number
          trigger_product_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_category?: string | null
          discount_product_id?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          name?: string
          starts_at?: string | null
          trigger_category?: string | null
          trigger_min_qty?: number
          trigger_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_rules_discount_product_id_fkey"
            columns: ["discount_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_rules_trigger_product_id_fkey"
            columns: ["trigger_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cart_recovery_links: {
        Row: {
          cart_id: string | null
          claimed_at: string | null
          created_at: string
          created_by_admin_id: string | null
          discount_type: string
          discount_value: number
          email_error: string | null
          email_sent_at: string | null
          email_status: string | null
          expires_at: string
          id: string
          offer_code: string
          offer_id: string
          recipient_email: string
          token: string
          updated_at: string
          used_at: string | null
          used_in_order_id: string | null
          user_id: string | null
        }
        Insert: {
          cart_id?: string | null
          claimed_at?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          discount_type: string
          discount_value: number
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          expires_at?: string
          id?: string
          offer_code: string
          offer_id: string
          recipient_email: string
          token?: string
          updated_at?: string
          used_at?: string | null
          used_in_order_id?: string | null
          user_id?: string | null
        }
        Update: {
          cart_id?: string | null
          claimed_at?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          discount_type?: string
          discount_value?: number
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          expires_at?: string
          id?: string
          offer_code?: string
          offer_id?: string
          recipient_email?: string
          token?: string
          updated_at?: string
          used_at?: string | null
          used_in_order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_recovery_links_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_recovery_links_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_recovery_links_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_recovery_links_used_in_order_id_fkey"
            columns: ["used_in_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_recovery_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      categories: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          conversation_token: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          order_number: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          conversation_token?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          order_number?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          conversation_token?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          order_number?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_change_requests: {
        Row: {
          created_at: string
          last_sent_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_sent_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_sent_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          code: string
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          last_name: string | null
          username: string | null
          verified_at: string | null
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          expires_at: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          username?: string | null
          verified_at?: string | null
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          username?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          name: string
          properties: Json | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          name: string
          properties?: Json | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          name?: string
          properties?: Json | null
          session_id?: string | null
          source?: string | null
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
      gallery_items: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gift_card_email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          gift_card_id: string | null
          id: string
          recipient_email: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          gift_card_id?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          gift_card_id?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_email_logs_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          currency: string
          current_balance_eur: number
          expires_at: string | null
          id: string
          initial_value_eur: number
          personal_message: string | null
          purchased_by_email: string | null
          purchased_by_user_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          current_balance_eur?: number
          expires_at?: string | null
          id?: string
          initial_value_eur: number
          personal_message?: string | null
          purchased_by_email?: string | null
          purchased_by_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          current_balance_eur?: number
          expires_at?: string | null
          id?: string
          initial_value_eur?: number
          personal_message?: string | null
          purchased_by_email?: string | null
          purchased_by_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_purchased_by_user_id_fkey"
            columns: ["purchased_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_redeemed_by_user_id_fkey"
            columns: ["redeemed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_messages: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string
          message: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id: string
          message: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string
          message?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          failed_count: number | null
          id: string
          recipients_count: number | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey"
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
          applicable_categories: Json | null
          applicable_products: Json | null
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          free_shipping: boolean | null
          id: string
          max_redemptions: number | null
          min_cart_total: number | null
          per_user_limit: number | null
          stackable: boolean | null
          starts_at: string | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          applicable_categories?: Json | null
          applicable_products?: Json | null
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          free_shipping?: boolean | null
          id?: string
          max_redemptions?: number | null
          min_cart_total?: number | null
          per_user_limit?: number | null
          stackable?: boolean | null
          starts_at?: string | null
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          applicable_categories?: Json | null
          applicable_products?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          free_shipping?: boolean | null
          id?: string
          max_redemptions?: number | null
          min_cart_total?: number | null
          per_user_limit?: number | null
          stackable?: boolean | null
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
          credits_earned_cents: number | null
          credits_redeemed_cents: number | null
          credits_status: string | null
          currency: string
          deposit_total_eur: number
          discount_cents: number | null
          discount_eur: number
          email: string
          fbclid: string | null
          first_name: string
          gclid: string | null
          id: string
          inventory_deducted_at: string | null
          invoice_address: string | null
          invoice_company_name: string | null
          invoice_country: string | null
          invoice_number: string | null
          invoice_vat_code: string | null
          landing_page: string | null
          last_name: string
          notes: string | null
          offer_code: string | null
          offer_id: string | null
          order_number: string
          paid_amount_cents: number | null
          paid_at: string | null
          payment_method_code: string | null
          payment_plan: Database["public"]["Enums"]["payment_plan"]
          payment_provider: string | null
          phone: string | null
          preorder_eta_weeks_max: number | null
          preorder_eta_weeks_min: number | null
          preorder_flag: boolean
          shipping_address_json: Json
          shipping_cents: number | null
          shipping_eur: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number | null
          subtotal_eur: number
          total_cents: number | null
          total_eur: number
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          wants_invoice: boolean | null
        }
        Insert: {
          balance_paid_at?: string | null
          balance_total_eur: number
          created_at?: string
          credits_earned_cents?: number | null
          credits_redeemed_cents?: number | null
          credits_status?: string | null
          currency?: string
          deposit_total_eur: number
          discount_cents?: number | null
          discount_eur?: number
          email: string
          fbclid?: string | null
          first_name: string
          gclid?: string | null
          id?: string
          inventory_deducted_at?: string | null
          invoice_address?: string | null
          invoice_company_name?: string | null
          invoice_country?: string | null
          invoice_number?: string | null
          invoice_vat_code?: string | null
          landing_page?: string | null
          last_name: string
          notes?: string | null
          offer_code?: string | null
          offer_id?: string | null
          order_number: string
          paid_amount_cents?: number | null
          paid_at?: string | null
          payment_method_code?: string | null
          payment_plan?: Database["public"]["Enums"]["payment_plan"]
          payment_provider?: string | null
          phone?: string | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          preorder_flag?: boolean
          shipping_address_json?: Json
          shipping_cents?: number | null
          shipping_eur?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number | null
          subtotal_eur: number
          total_cents?: number | null
          total_eur: number
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wants_invoice?: boolean | null
        }
        Update: {
          balance_paid_at?: string | null
          balance_total_eur?: number
          created_at?: string
          credits_earned_cents?: number | null
          credits_redeemed_cents?: number | null
          credits_status?: string | null
          currency?: string
          deposit_total_eur?: number
          discount_cents?: number | null
          discount_eur?: number
          email?: string
          fbclid?: string | null
          first_name?: string
          gclid?: string | null
          id?: string
          inventory_deducted_at?: string | null
          invoice_address?: string | null
          invoice_company_name?: string | null
          invoice_country?: string | null
          invoice_number?: string | null
          invoice_vat_code?: string | null
          landing_page?: string | null
          last_name?: string
          notes?: string | null
          offer_code?: string | null
          offer_id?: string | null
          order_number?: string
          paid_amount_cents?: number | null
          paid_at?: string | null
          payment_method_code?: string | null
          payment_plan?: Database["public"]["Enums"]["payment_plan"]
          payment_provider?: string | null
          phone?: string | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          preorder_flag?: boolean
          shipping_address_json?: Json
          shipping_cents?: number | null
          shipping_eur?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number | null
          subtotal_eur?: number
          total_cents?: number | null
          total_eur?: number
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wants_invoice?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
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
      product_reviews: {
        Row: {
          admin_reply: string | null
          admin_reply_at: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          order_id: string | null
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string | null
          product_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string | null
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          inventory_qty: number
          name: string
          option_type: string
          option_value: string
          price_adjustment_eur: number | null
          product_id: string
          sku_suffix: string
          sort_order: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_qty?: number
          name: string
          option_type: string
          option_value: string
          price_adjustment_eur?: number | null
          product_id: string
          sku_suffix: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_qty?: number
          name?: string
          option_type?: string
          option_value?: string
          price_adjustment_eur?: number | null
          product_id?: string
          sku_suffix?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewer_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewer_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: Json | null
          canonical_slug: string | null
          category: Database["public"]["Enums"]["product_category"]
          category_id: string | null
          cost_price_eur: number | null
          created_at: string
          credits_cost_eur: number | null
          deposit_eur: number
          description: string | null
          details_json: Json | null
          id: string
          images: Json
          inventory_qty: number | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          preorder_eta_weeks_max: number | null
          preorder_eta_weeks_min: number | null
          price_eur: number
          sale_price_eur: number | null
          short_desc: string | null
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_status: Database["public"]["Enums"]["stock_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          badges?: Json | null
          canonical_slug?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          category_id?: string | null
          cost_price_eur?: number | null
          created_at?: string
          credits_cost_eur?: number | null
          deposit_eur: number
          description?: string | null
          details_json?: Json | null
          id?: string
          images?: Json
          inventory_qty?: number | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          price_eur: number
          sale_price_eur?: number | null
          short_desc?: string | null
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_status?: Database["public"]["Enums"]["stock_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          badges?: Json | null
          canonical_slug?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          category_id?: string | null
          cost_price_eur?: number | null
          created_at?: string
          credits_cost_eur?: number | null
          deposit_eur?: number
          description?: string | null
          details_json?: Json | null
          id?: string
          images?: Json
          inventory_qty?: number | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          preorder_eta_weeks_max?: number | null
          preorder_eta_weeks_min?: number | null
          price_eur?: number
          sale_price_eur?: number | null
          short_desc?: string | null
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_status?: Database["public"]["Enums"]["stock_status"]
          tags?: string[] | null
          title?: string
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
      promo_banners: {
        Row: {
          active: boolean | null
          background_color: string | null
          badge_text: string | null
          badge_variant: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          link_text: string | null
          link_url: string
          secondary_link_text: string | null
          secondary_link_url: string | null
          sort_order: number | null
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          background_color?: string | null
          badge_text?: string | null
          badge_variant?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_text?: string | null
          link_url?: string
          secondary_link_text?: string | null
          secondary_link_url?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          background_color?: string | null
          badge_text?: string | null
          badge_variant?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_text?: string | null
          link_url?: string
          secondary_link_text?: string | null
          secondary_link_url?: string | null
          sort_order?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          discount_amount_eur: number | null
          id: string
          offer_id: string
          order_id: string | null
          redeemed_at: string
          user_id: string
        }
        Insert: {
          discount_amount_eur?: number | null
          id?: string
          offer_id: string
          order_id?: string | null
          redeemed_at?: string
          user_id: string
        }
        Update: {
          discount_amount_eur?: number | null
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
      refunds: {
        Row: {
          admin_notes: string | null
          amount_eur: number
          created_at: string | null
          customer_notes: string | null
          id: string
          is_full_refund: boolean | null
          order_id: string
          processed_at: string | null
          reason: string
          requested_at: string | null
          status: string
          stripe_refund_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_eur: number
          created_at?: string | null
          customer_notes?: string | null
          id?: string
          is_full_refund?: boolean | null
          order_id: string
          processed_at?: string | null
          reason: string
          requested_at?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_eur?: number
          created_at?: string | null
          customer_notes?: string | null
          id?: string
          is_full_refund?: boolean | null
          order_id?: string
          processed_at?: string | null
          reason?: string
          requested_at?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          issued_at: string | null
          product_id: string
          serial: string
          status: string
        }
        Insert: {
          issued_at?: string | null
          product_id: string
          serial: string
          status?: string
        }
        Update: {
          issued_at?: string | null
          product_id?: string
          serial?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          anonymous_id: string
          fbclid: string | null
          first_seen_at: string
          gclid: string | null
          id: string
          ip_hash: string | null
          landing_page: string | null
          last_seen_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          anonymous_id: string
          fbclid?: string | null
          first_seen_at?: string
          gclid?: string | null
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          anonymous_id?: string
          fbclid?: string | null
          first_seen_at?: string
          gclid?: string | null
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
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
      stock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_builders: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          quantity: number
          serial: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          quantity?: number
          serial?: string | null
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number
          serial?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_builders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_builders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_builders_serial_fkey"
            columns: ["serial"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["serial"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          collection_public: boolean
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string | null
          id: string
          last_login_at: string | null
          last_name: string | null
          marketing_opt_in: boolean | null
          marketing_opt_in_at: string | null
          personalization_opt_in: boolean | null
          personalization_opt_in_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string | null
          username_lower: string | null
        }
        Insert: {
          avatar_url?: string | null
          collection_public?: boolean
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          id: string
          last_login_at?: string | null
          last_name?: string | null
          marketing_opt_in?: boolean | null
          marketing_opt_in_at?: string | null
          personalization_opt_in?: boolean | null
          personalization_opt_in_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
          username_lower?: string | null
        }
        Update: {
          avatar_url?: string | null
          collection_public?: boolean
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          marketing_opt_in?: boolean | null
          marketing_opt_in_at?: string | null
          personalization_opt_in?: boolean | null
          personalization_opt_in_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
          username_lower?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_eur: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount_eur: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount_eur?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_eur: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_eur?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_eur?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      dearmor: { Args: { "": string }; Returns: string }
      decrement_inventory_for_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      get_public_collection: {
        Args: { target_username: string }
        Returns: {
          created_at: string
          product_details_json: Json
          product_id: string
          product_images: Json
          product_slug: string
          product_title: string
          quantity: number
          source: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
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
      product_category:
        | "engines"
        | "cars"
        | "flowers"
        | "other"
        | "architektura-ir-gelezinkeliai"
        | "ateities-automobiliai"
        | "automobiliai"
        | "aviacijos-varikliai"
        | "botanika"
        | "botanika-ir-namu-dekoras"
        | "buldozeriai-ir-krautuvai"
        | "dinozauru-pasaulis"
        | "doko-scenos"
        | "dyzeliniai-varikliai"
        | "ekskavatoriai"
        | "gamtos-kuriniai"
        | "garveziai"
        | "gbc-serija"
        | "izymus-pastatai"
        | "jachtos-ir-buriavimas"
        | "karine-technika"
        | "karyba"
        | "klasikiniai-ir-retro"
        | "kosmosas-ir-inzinerija"
        | "kosmoso-tyrinejimai"
        | "kranai"
        | "kurybines-muzikines-dezutes"
        | "laivai-butelyje"
        | "laivai-ir-piratai"
        | "mechaniniai-laikrodziai"
        | "mechos-kariai"
        | "miesto-gelbejimo-ir-policijos-technika"
        | "mini-124-automobiliai"
        | "mini-botanika"
        | "mini-dinozaurai"
        | "mini-garsus-automobiliai"
        | "mini-gatviu-vaizdai"
        | "mini-karine-aviacijos-technika"
        | "mini-miesto-dekoras"
        | "mini-pakeles-automobiliai"
        | "mini-pasaulis"
        | "mini-statybine-technika"
        | "mini-sunkioji-technika"
        | "mini-sunkvezimiai"
        | "mini-visureigiai-modeliai"
        | "mini-zemes-ukio-technika"
        | "miskininkystes-technika"
        | "modernus-ir-greitieji-traukiniai"
        | "modernus-laivynas"
        | "moduliniai-pastatai"
        | "modulinis-gatves-vaizdas"
        | "motociklai"
        | "muge-ir-parkas"
        | "pagal-kebulo-tipa"
        | "piratu-ir-kariniai-laivai"
        | "piratu-laivai"
        | "rc-ir-di-robotai"
        | "robotai-ir-mechos"
        | "sakiniai-krautuvai"
        | "senoves-kariniai-laivai"
        | "sportiniu-automobiliu-varikliai"
        | "statyba"
        | "statyba-ir-sunkioji-technika"
        | "sunkiasvoriai-sunkvezimiai"
        | "superautomobiliai-lenktyniniai"
        | "tankai-ir-sarvuociai"
        | "technikos-prietaisai"
        | "technikos-transportas"
        | "traktoriai-ir-kombainai"
        | "transportas-ir-logistika"
        | "traukiniai-ir-gelezinkeliai"
        | "uostas-ir-pajuris"
        | "varikliai"
        | "varikliai-ir-transmisijos"
        | "viduramziu-ir-retro-pastatai"
        | "vilkikai-ir-pagalbos-technika"
        | "visureigiai-ir-suv"
        | "zaislai-ginklai"
        | "zemes-ukis-ir-miskininkyste"
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
  graphql_public: {
    Enums: {},
  },
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
      product_category: [
        "engines",
        "cars",
        "flowers",
        "other",
        "architektura-ir-gelezinkeliai",
        "ateities-automobiliai",
        "automobiliai",
        "aviacijos-varikliai",
        "botanika",
        "botanika-ir-namu-dekoras",
        "buldozeriai-ir-krautuvai",
        "dinozauru-pasaulis",
        "doko-scenos",
        "dyzeliniai-varikliai",
        "ekskavatoriai",
        "gamtos-kuriniai",
        "garveziai",
        "gbc-serija",
        "izymus-pastatai",
        "jachtos-ir-buriavimas",
        "karine-technika",
        "karyba",
        "klasikiniai-ir-retro",
        "kosmosas-ir-inzinerija",
        "kosmoso-tyrinejimai",
        "kranai",
        "kurybines-muzikines-dezutes",
        "laivai-butelyje",
        "laivai-ir-piratai",
        "mechaniniai-laikrodziai",
        "mechos-kariai",
        "miesto-gelbejimo-ir-policijos-technika",
        "mini-124-automobiliai",
        "mini-botanika",
        "mini-dinozaurai",
        "mini-garsus-automobiliai",
        "mini-gatviu-vaizdai",
        "mini-karine-aviacijos-technika",
        "mini-miesto-dekoras",
        "mini-pakeles-automobiliai",
        "mini-pasaulis",
        "mini-statybine-technika",
        "mini-sunkioji-technika",
        "mini-sunkvezimiai",
        "mini-visureigiai-modeliai",
        "mini-zemes-ukio-technika",
        "miskininkystes-technika",
        "modernus-ir-greitieji-traukiniai",
        "modernus-laivynas",
        "moduliniai-pastatai",
        "modulinis-gatves-vaizdas",
        "motociklai",
        "muge-ir-parkas",
        "pagal-kebulo-tipa",
        "piratu-ir-kariniai-laivai",
        "piratu-laivai",
        "rc-ir-di-robotai",
        "robotai-ir-mechos",
        "sakiniai-krautuvai",
        "senoves-kariniai-laivai",
        "sportiniu-automobiliu-varikliai",
        "statyba",
        "statyba-ir-sunkioji-technika",
        "sunkiasvoriai-sunkvezimiai",
        "superautomobiliai-lenktyniniai",
        "tankai-ir-sarvuociai",
        "technikos-prietaisai",
        "technikos-transportas",
        "traktoriai-ir-kombainai",
        "transportas-ir-logistika",
        "traukiniai-ir-gelezinkeliai",
        "uostas-ir-pajuris",
        "varikliai",
        "varikliai-ir-transmisijos",
        "viduramziu-ir-retro-pastatai",
        "vilkikai-ir-pagalbos-technika",
        "visureigiai-ir-suv",
        "zaislai-ginklai",
        "zemes-ukis-ir-miskininkyste",
      ],
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
