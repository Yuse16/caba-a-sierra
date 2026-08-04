export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      admin_profiles: {
        Row: {
          created_at: string
          disabled_at: string | null
          display_name: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          display_name: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          display_name?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["admin_role"] | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: number
          record_id: string | null
          table_name: string
          transaction_id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["admin_role"] | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: never
          record_id?: string | null
          table_name: string
          transaction_id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["admin_role"] | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: never
          record_id?: string | null
          table_name?: string
          transaction_id?: number
        }
        Relationships: []
      }
      availability_entries: {
        Row: {
          cabin_id: string
          check_in: string
          check_out: string
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["availability_kind"]
          period: unknown
          reason: string
          released_at: string | null
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
        }
        Insert: {
          cabin_id: string
          check_in: string
          check_out: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["availability_kind"]
          period?: unknown
          reason?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Update: {
          cabin_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["availability_kind"]
          period?: unknown
          reason?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_entries_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_entries_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_inquiries: {
        Row: {
          cabin_id: string
          check_in: string
          check_out: string
          created_at: string
          customer_id: string
          guests: number
          id: string
          idempotency_key: string
          message: string
          origin: string
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          cabin_id: string
          check_in: string
          check_out: string
          created_at?: string
          customer_id: string
          guests: number
          id?: string
          idempotency_key?: string
          message?: string
          origin?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          cabin_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          customer_id?: string
          guests?: number
          id?: string
          idempotency_key?: string
          message?: string
          origin?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_inquiries_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_inquiries_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          created_at: string
          default_messages: Json
          id: boolean
          max_stay_nights: number | null
          min_stay_nights: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_messages?: Json
          id?: boolean
          max_stay_nights?: number | null
          min_stay_nights?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_messages?: Json
          id?: boolean
          max_stay_nights?: number | null
          min_stay_nights?: number
          updated_at?: string
        }
        Relationships: []
      }
      cabin_categories: {
        Row: {
          cabin_id: string
          category_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          cabin_id: string
          category_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          cabin_id?: string
          category_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_categories_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_categories_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_images: {
        Row: {
          alt_text: string
          asset_id: string
          cabin_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_cover: boolean
          position: number
          public_url: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string
          asset_id: string
          cabin_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_cover?: boolean
          position?: number
          public_url?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string
          asset_id?: string
          cabin_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_cover?: boolean
          position?: number
          public_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_images_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_images_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_images_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_owner_assignments: {
        Row: {
          agreed_commission: number | null
          cabin_id: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          owner_id: string
          updated_at: string
        }
        Insert: {
          agreed_commission?: number | null
          cabin_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          owner_id: string
          updated_at?: string
        }
        Update: {
          agreed_commission?: number | null
          cabin_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_owner_assignments_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_owner_assignments_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_owner_assignments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_services: {
        Row: {
          cabin_id: string
          created_at: string
          service_id: string
          updated_at: string
        }
        Insert: {
          cabin_id: string
          created_at?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          cabin_id?: string
          created_at?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_services_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_services_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          accepts_pets: boolean
          bathrooms: number
          bedrooms: number
          beds: number
          cabin_type: string
          check_in_time: string
          check_out_time: string
          contact_whatsapp: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string
          display_order: number
          id: string
          legacy_id: string | null
          location: string
          max_guests: number
          min_guests: number
          name: string
          nightly_price: number
          old_price: number | null
          publication_state: Database["public"]["Enums"]["publication_state"]
          published_at: string | null
          rules: string[]
          short_description: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepts_pets?: boolean
          bathrooms?: number
          bedrooms?: number
          beds?: number
          cabin_type?: string
          check_in_time?: string
          check_out_time?: string
          contact_whatsapp?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string
          display_order?: number
          id?: string
          legacy_id?: string | null
          location?: string
          max_guests?: number
          min_guests?: number
          name: string
          nightly_price?: number
          old_price?: number | null
          publication_state?: Database["public"]["Enums"]["publication_state"]
          published_at?: string | null
          rules?: string[]
          short_description?: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepts_pets?: boolean
          bathrooms?: number
          bedrooms?: number
          beds?: number
          cabin_type?: string
          check_in_time?: string
          check_out_time?: string
          contact_whatsapp?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string
          display_order?: number
          id?: string
          legacy_id?: string | null
          location?: string
          max_guests?: number
          min_guests?: number
          name?: string
          nightly_price?: number
          old_price?: number | null
          publication_state?: Database["public"]["Enums"]["publication_state"]
          published_at?: string | null
          rules?: string[]
          short_description?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          consent_at: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone_display: string
          phone_e164: string
          updated_at: string
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone_display: string
          phone_e164: string
          updated_at?: string
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone_display?: string
          phone_e164?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_notes: {
        Row: {
          author_id: string | null
          body: string
          cabin_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          inquiry_id: string | null
          owner_id: string | null
          promotion_id: string | null
          reservation_id: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          cabin_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          inquiry_id?: string | null
          owner_id?: string | null
          promotion_id?: string | null
          reservation_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          cabin_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          inquiry_id?: string | null
          owner_id?: string | null
          promotion_id?: string | null
          reservation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "booking_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "public_promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          byte_size: number
          created_at: string
          deleted_at: string | null
          extension: string
          height: number
          id: string
          mime_type: string
          original_name: string
          processing_status: Database["public"]["Enums"]["media_processing_status"]
          public_bucket: string | null
          public_path: string | null
          sha256: string
          source_bucket: string
          source_path: string
          updated_at: string
          uploaded_by: string | null
          width: number
        }
        Insert: {
          byte_size: number
          created_at?: string
          deleted_at?: string | null
          extension: string
          height: number
          id?: string
          mime_type: string
          original_name: string
          processing_status?: Database["public"]["Enums"]["media_processing_status"]
          public_bucket?: string | null
          public_path?: string | null
          sha256: string
          source_bucket: string
          source_path: string
          updated_at?: string
          uploaded_by?: string | null
          width: number
        }
        Update: {
          byte_size?: number
          created_at?: string
          deleted_at?: string | null
          extension?: string
          height?: number
          id?: string
          mime_type?: string
          original_name?: string
          processing_status?: Database["public"]["Enums"]["media_processing_status"]
          public_bucket?: string | null
          public_path?: string | null
          sha256?: string
          source_bucket?: string
          source_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number
        }
        Relationships: []
      }
      owner_contacts: {
        Row: {
          contact_type: Database["public"]["Enums"]["owner_contact_type"]
          created_at: string
          deleted_at: string | null
          display_value: string
          id: string
          is_primary: boolean
          label: string
          normalized_value: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["owner_contact_type"]
          created_at?: string
          deleted_at?: string | null
          display_value: string
          id?: string
          is_primary?: boolean
          label?: string
          normalized_value: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["owner_contact_type"]
          created_at?: string
          deleted_at?: string | null
          display_value?: string
          id?: string
          is_primary?: boolean
          label?: string
          normalized_value?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          legacy_id: string | null
          name: string
          notes: string
          preferred_contact: Database["public"]["Enums"]["preferred_contact_method"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          name: string
          notes?: string
          preferred_contact?: Database["public"]["Enums"]["preferred_contact_method"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          name?: string
          notes?: string
          preferred_contact?: Database["public"]["Enums"]["preferred_contact_method"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      promotion_images: {
        Row: {
          alt_text: string
          asset_id: string
          created_at: string
          deleted_at: string | null
          id: string
          promotion_id: string
          public_url: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string
          asset_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          promotion_id: string
          public_url?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string
          asset_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          promotion_id?: string
          public_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_images_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_images_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_images_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "public_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string | null
          cta_label: string
          deleted_at: string | null
          display_order: number
          ends_on: string | null
          href: string
          id: string
          image_alt: string
          legacy_id: string | null
          name: string
          publication_state: Database["public"]["Enums"]["publication_state"]
          short_description: string
          starts_on: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cta_label?: string
          deleted_at?: string | null
          display_order?: number
          ends_on?: string | null
          href?: string
          id?: string
          image_alt?: string
          legacy_id?: string | null
          name: string
          publication_state?: Database["public"]["Enums"]["publication_state"]
          short_description?: string
          starts_on?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cta_label?: string
          deleted_at?: string | null
          display_order?: number
          ends_on?: string | null
          href?: string
          id?: string
          image_alt?: string
          legacy_id?: string | null
          name?: string
          publication_state?: Database["public"]["Enums"]["publication_state"]
          short_description?: string
          starts_on?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      public_site_settings: {
        Row: {
          business_hours: string
          business_name: string
          created_at: string
          currency: string
          general_location: string
          id: boolean
          logo_url: string | null
          public_email: string | null
          public_phone: string
          public_policies: Json
          public_whatsapp: string
          social_links: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          business_hours?: string
          business_name?: string
          created_at?: string
          currency?: string
          general_location?: string
          id?: boolean
          logo_url?: string | null
          public_email?: string | null
          public_phone?: string
          public_policies?: Json
          public_whatsapp?: string
          social_links?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_hours?: string
          business_name?: string
          created_at?: string
          currency?: string
          general_location?: string
          id?: boolean
          logo_url?: string | null
          public_email?: string | null
          public_phone?: string
          public_policies?: Json
          public_whatsapp?: string
          social_links?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          adults: number
          availability_entry_id: string | null
          cabin_id: string
          check_in: string
          check_out: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          estimated_total: number
          folio: string
          guests: number
          id: string
          inquiry_id: string | null
          internal_notes: string
          minors: number
          nightly_price: number
          origin: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          adults: number
          availability_entry_id?: string | null
          cabin_id: string
          check_in: string
          check_out: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          estimated_total: number
          folio: string
          guests: number
          id?: string
          inquiry_id?: string | null
          internal_notes?: string
          minors?: number
          nightly_price: number
          origin?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          adults?: number
          availability_entry_id?: string | null
          cabin_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          estimated_total?: number
          folio?: string
          guests?: number
          id?: string
          inquiry_id?: string | null
          internal_notes?: string
          minors?: number
          nightly_price?: number
          origin?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_availability_entry_id_fkey"
            columns: ["availability_entry_id"]
            isOneToOne: true
            referencedRelation: "availability_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_availability_matches_fkey"
            columns: [
              "availability_entry_id",
              "cabin_id",
              "check_in",
              "check_out",
            ]
            isOneToOne: false
            referencedRelation: "availability_entries"
            referencedColumns: ["id", "cabin_id", "check_in", "check_out"]
          },
          {
            foreignKeyName: "reservations_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "public_cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "booking_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_cabins: {
        Row: {
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          cabin_type: string | null
          categories: string[] | null
          description: string | null
          display_order: number | null
          id: string | null
          image_url: string | null
          location: string | null
          max_guests: number | null
          min_guests: number | null
          name: string | null
          nightly_price: number | null
          old_price: number | null
          slug: string | null
        }
        Relationships: []
      }
      public_promotions: {
        Row: {
          cta_label: string | null
          display_order: number | null
          href: string | null
          id: string | null
          image_alt: string | null
          image_alt_text: string | null
          image_url: string | null
          name: string | null
          short_description: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      reorder_promotions: {
        Args: { ordered_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      admin_role: "admin" | "editor"
      availability_kind: "hold" | "reservation" | "blocked" | "maintenance"
      availability_status: "active" | "released"
      inquiry_status:
        | "new"
        | "pending"
        | "contacted"
        | "available"
        | "unavailable"
        | "converted"
        | "closed"
      media_processing_status:
        | "staging"
        | "processing"
        | "ready"
        | "failed"
        | "pending_delete"
        | "deleted"
      owner_contact_type: "phone" | "whatsapp" | "email" | "other"
      preferred_contact_method: "whatsapp" | "phone" | "message" | "email"
      publication_state: "draft" | "published" | "hidden"
      reservation_status:
        | "new"
        | "pending"
        | "held"
        | "confirmed"
        | "cancelled"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
      admin_role: ["admin", "editor"],
      availability_kind: ["hold", "reservation", "blocked", "maintenance"],
      availability_status: ["active", "released"],
      inquiry_status: [
        "new",
        "pending",
        "contacted",
        "available",
        "unavailable",
        "converted",
        "closed",
      ],
      media_processing_status: [
        "staging",
        "processing",
        "ready",
        "failed",
        "pending_delete",
        "deleted",
      ],
      owner_contact_type: ["phone", "whatsapp", "email", "other"],
      preferred_contact_method: ["whatsapp", "phone", "message", "email"],
      publication_state: ["draft", "published", "hidden"],
      reservation_status: [
        "new",
        "pending",
        "held",
        "confirmed",
        "cancelled",
        "completed",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
