export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          details: Json | null;
          entity_id: string | null;
          entity_type: string;
          id: string;
          performed_at: string;
          performed_by: string | null;
        };
        Insert: {
          action: string;
          details?: Json | null;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          performed_at?: string;
          performed_by?: string | null;
        };
        Update: {
          action?: string;
          details?: Json | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          performed_at?: string;
          performed_by?: string | null;
        };
        Relationships: [];
      };
      bom_headers: {
        Row: {
          active: boolean;
          base_quantity: number;
          bom_number: string;
          created_at: string;
          created_by: string | null;
          effective_from: string;
          effective_to: string | null;
          id: string;
          product_id: string;
          remarks: string | null;
          version: string;
        };
        Insert: {
          active?: boolean;
          base_quantity: number;
          bom_number: string;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          product_id: string;
          remarks?: string | null;
          version?: string;
        };
        Update: {
          active?: boolean;
          base_quantity?: number;
          bom_number?: string;
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          product_id?: string;
          remarks?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bom_headers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_goods_stock";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "bom_headers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_products";
            referencedColumns: ["id"];
          },
        ];
      };
      bom_items: {
        Row: {
          bom_id: string;
          id: string;
          is_primary_material: boolean;
          material_id: string;
          sequence: number;
          standard_quantity: number;
          uom: string;
        };
        Insert: {
          bom_id: string;
          id?: string;
          is_primary_material?: boolean;
          material_id: string;
          sequence?: number;
          standard_quantity: number;
          uom?: string;
        };
        Update: {
          bom_id?: string;
          id?: string;
          is_primary_material?: boolean;
          material_id?: string;
          sequence?: number;
          standard_quantity?: number;
          uom?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey";
            columns: ["bom_id"];
            isOneToOne: false;
            referencedRelation: "bom_headers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bom_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bom_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
        ];
      };
      company_settings: {
        Row: {
          address: string | null;
          city: string | null;
          company_name: string;
          email: string | null;
          gst_number: string | null;
          id: number;
          phone: string | null;
          pin_code: string | null;
          state: string | null;
          updated_at: string;
          wastage_warning_threshold: number;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          company_name?: string;
          email?: string | null;
          gst_number?: string | null;
          id?: number;
          phone?: string | null;
          pin_code?: string | null;
          state?: string | null;
          updated_at?: string;
          wastage_warning_threshold?: number;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          company_name?: string;
          email?: string | null;
          gst_number?: string | null;
          id?: number;
          phone?: string | null;
          pin_code?: string | null;
          state?: string | null;
          updated_at?: string;
          wastage_warning_threshold?: number;
        };
        Relationships: [];
      };
      finished_goods_ledger: {
        Row: {
          created_at: string;
          id: string;
          jobber_id: string | null;
          product_id: string;
          quantity_in: number;
          quantity_out: number;
          remarks: string | null;
          transaction_date: string;
          transaction_type: string;
          voucher_id: string | null;
          voucher_number: string | null;
          voucher_type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          jobber_id?: string | null;
          product_id: string;
          quantity_in?: number;
          quantity_out?: number;
          remarks?: string | null;
          transaction_date?: string;
          transaction_type: string;
          voucher_id?: string | null;
          voucher_number?: string | null;
          voucher_type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          jobber_id?: string | null;
          product_id?: string;
          quantity_in?: number;
          quantity_out?: number;
          remarks?: string | null;
          transaction_date?: string;
          transaction_type?: string;
          voucher_id?: string | null;
          voucher_number?: string | null;
          voucher_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finished_goods_ledger_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finished_goods_ledger_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_goods_stock";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "finished_goods_ledger_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_products";
            referencedColumns: ["id"];
          },
        ];
      };
      finished_products: {
        Row: {
          category: string | null;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          status: boolean;
          uom: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          status?: boolean;
          uom?: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          status?: boolean;
          uom?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobber_transfer_headers: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          challan_number: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          jobber_id: string;
          posted_at: string | null;
          posted_by: string | null;
          reference: string | null;
          remarks: string | null;
          status: string;
          vehicle_number: string | null;
          voucher_date: string;
          voucher_number: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          challan_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          jobber_id: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          remarks?: string | null;
          status?: string;
          vehicle_number?: string | null;
          voucher_date?: string;
          voucher_number: string;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          challan_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          jobber_id?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          remarks?: string | null;
          status?: string;
          vehicle_number?: string | null;
          voucher_date?: string;
          voucher_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobber_transfer_headers_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
        ];
      };
      jobber_transfer_items: {
        Row: {
          header_id: string;
          id: string;
          material_id: string;
          quantity: number;
          remarks: string | null;
        };
        Insert: {
          header_id: string;
          id?: string;
          material_id: string;
          quantity: number;
          remarks?: string | null;
        };
        Update: {
          header_id?: string;
          id?: string;
          material_id?: string;
          quantity?: number;
          remarks?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobber_transfer_items_header_id_fkey";
            columns: ["header_id"];
            isOneToOne: false;
            referencedRelation: "jobber_transfer_headers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobber_transfer_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobber_transfer_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
        ];
      };
      jobbers: {
        Row: {
          address: string | null;
          alt_phone: string | null;
          city: string | null;
          code: string;
          company_name: string | null;
          contact_person: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          gst_number: string | null;
          id: string;
          name: string;
          pan_number: string | null;
          phone: string | null;
          pin_code: string | null;
          remarks: string | null;
          state: string | null;
          status: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address?: string | null;
          alt_phone?: string | null;
          city?: string | null;
          code: string;
          company_name?: string | null;
          contact_person?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          gst_number?: string | null;
          id?: string;
          name: string;
          pan_number?: string | null;
          phone?: string | null;
          pin_code?: string | null;
          remarks?: string | null;
          state?: string | null;
          status?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address?: string | null;
          alt_phone?: string | null;
          city?: string | null;
          code?: string;
          company_name?: string | null;
          contact_person?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          gst_number?: string | null;
          id?: string;
          name?: string;
          pan_number?: string | null;
          phone?: string | null;
          pin_code?: string | null;
          remarks?: string | null;
          state?: string | null;
          status?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      material_return_headers: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          jobber_id: string;
          posted_at: string | null;
          posted_by: string | null;
          reference: string | null;
          remarks: string | null;
          status: string;
          voucher_date: string;
          voucher_number: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          jobber_id: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          remarks?: string | null;
          status?: string;
          voucher_date?: string;
          voucher_number: string;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          jobber_id?: string;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          remarks?: string | null;
          status?: string;
          voucher_date?: string;
          voucher_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_return_headers_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
        ];
      };
      material_return_items: {
        Row: {
          header_id: string;
          id: string;
          material_id: string;
          quantity: number;
          remarks: string | null;
        };
        Insert: {
          header_id: string;
          id?: string;
          material_id: string;
          quantity: number;
          remarks?: string | null;
        };
        Update: {
          header_id?: string;
          id?: string;
          material_id?: string;
          quantity?: number;
          remarks?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "material_return_items_header_id_fkey";
            columns: ["header_id"];
            isOneToOne: false;
            referencedRelation: "material_return_headers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_return_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_return_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
        ];
      };
      product_inward_consumption: {
        Row: {
          id: string;
          material_id: string;
          product_inward_id: string;
          standard_consumption: number;
          stock_after: number;
          stock_before: number;
          wastage_quantity: number;
        };
        Insert: {
          id?: string;
          material_id: string;
          product_inward_id: string;
          standard_consumption?: number;
          stock_after?: number;
          stock_before?: number;
          wastage_quantity?: number;
        };
        Update: {
          id?: string;
          material_id?: string;
          product_inward_id?: string;
          standard_consumption?: number;
          stock_after?: number;
          stock_before?: number;
          wastage_quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_inward_consumption_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_inward_consumption_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
          {
            foreignKeyName: "product_inward_consumption_product_inward_id_fkey";
            columns: ["product_inward_id"];
            isOneToOne: false;
            referencedRelation: "product_inward_headers";
            referencedColumns: ["id"];
          },
        ];
      };
      product_inward_headers: {
        Row: {
          actual_total_consumption: number;
          batch_number: string | null;
          bom_id: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          created_by: string | null;
          finished_quantity: number;
          id: string;
          jobber_challan_number: string | null;
          jobber_id: string;
          overall_wastage_kg: number;
          posted_at: string | null;
          posted_by: string | null;
          primary_material_id: string | null;
          product_id: string;
          production_reference: string | null;
          remarks: string | null;
          status: string;
          total_standard_consumption: number;
          voucher_date: string;
          voucher_number: string;
          wastage_percentage: number;
          wastage_remarks: string | null;
        };
        Insert: {
          actual_total_consumption?: number;
          batch_number?: string | null;
          bom_id: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          finished_quantity: number;
          id?: string;
          jobber_challan_number?: string | null;
          jobber_id: string;
          overall_wastage_kg?: number;
          posted_at?: string | null;
          posted_by?: string | null;
          primary_material_id?: string | null;
          product_id: string;
          production_reference?: string | null;
          remarks?: string | null;
          status?: string;
          total_standard_consumption?: number;
          voucher_date?: string;
          voucher_number: string;
          wastage_percentage?: number;
          wastage_remarks?: string | null;
        };
        Update: {
          actual_total_consumption?: number;
          batch_number?: string | null;
          bom_id?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          finished_quantity?: number;
          id?: string;
          jobber_challan_number?: string | null;
          jobber_id?: string;
          overall_wastage_kg?: number;
          posted_at?: string | null;
          posted_by?: string | null;
          primary_material_id?: string | null;
          product_id?: string;
          production_reference?: string | null;
          remarks?: string | null;
          status?: string;
          total_standard_consumption?: number;
          voucher_date?: string;
          voucher_number?: string;
          wastage_percentage?: number;
          wastage_remarks?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_inward_headers_bom_id_fkey";
            columns: ["bom_id"];
            isOneToOne: false;
            referencedRelation: "bom_headers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_inward_headers_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_inward_headers_primary_material_id_fkey";
            columns: ["primary_material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_inward_headers_primary_material_id_fkey";
            columns: ["primary_material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
          {
            foreignKeyName: "product_inward_headers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_goods_stock";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_inward_headers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_products";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      raw_material_inward_headers: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          challan_number: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          invoice_number: string | null;
          posted_at: string | null;
          posted_by: string | null;
          reference: string | null;
          remarks: string | null;
          status: string;
          supplier: string | null;
          transaction_type: string;
          voucher_date: string;
          voucher_number: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          challan_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_number?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          remarks?: string | null;
          status?: string;
          supplier?: string | null;
          transaction_type?: string;
          voucher_date?: string;
          voucher_number: string;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          challan_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_number?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          reference?: string | null;
          remarks?: string | null;
          status?: string;
          supplier?: string | null;
          transaction_type?: string;
          voucher_date?: string;
          voucher_number?: string;
        };
        Relationships: [];
      };
      raw_material_inward_items: {
        Row: {
          header_id: string;
          id: string;
          material_id: string;
          quantity: number;
          remarks: string | null;
        };
        Insert: {
          header_id: string;
          id?: string;
          material_id: string;
          quantity: number;
          remarks?: string | null;
        };
        Update: {
          header_id?: string;
          id?: string;
          material_id?: string;
          quantity?: number;
          remarks?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "raw_material_inward_items_header_id_fkey";
            columns: ["header_id"];
            isOneToOne: false;
            referencedRelation: "raw_material_inward_headers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_material_inward_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_material_inward_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
        ];
      };
      raw_material_ledger: {
        Row: {
          created_at: string;
          id: string;
          jobber_id: string | null;
          location_type: string;
          material_id: string;
          quantity_in: number;
          quantity_out: number;
          remarks: string | null;
          standard_consumption: number;
          transaction_date: string;
          transaction_type: string;
          voucher_id: string | null;
          voucher_number: string | null;
          voucher_type: string;
          wastage_quantity: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          jobber_id?: string | null;
          location_type: string;
          material_id: string;
          quantity_in?: number;
          quantity_out?: number;
          remarks?: string | null;
          standard_consumption?: number;
          transaction_date?: string;
          transaction_type: string;
          voucher_id?: string | null;
          voucher_number?: string | null;
          voucher_type: string;
          wastage_quantity?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          jobber_id?: string | null;
          location_type?: string;
          material_id?: string;
          quantity_in?: number;
          quantity_out?: number;
          remarks?: string | null;
          standard_consumption?: number;
          transaction_date?: string;
          transaction_type?: string;
          voucher_id?: string | null;
          voucher_number?: string | null;
          voucher_type?: string;
          wastage_quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "raw_material_ledger_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_material_ledger_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_material_ledger_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
        ];
      };
      raw_materials: {
        Row: {
          category: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          minimum_stock: number;
          name: string;
          status: boolean;
          uom: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          minimum_stock?: number;
          name: string;
          status?: boolean;
          uom?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          minimum_stock?: number;
          name?: string;
          status?: boolean;
          uom?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_adjustments: {
        Row: {
          adjustment_type: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          jobber_id: string | null;
          location_type: string;
          material_id: string | null;
          posted_at: string | null;
          posted_by: string | null;
          product_id: string | null;
          quantity: number;
          reason: string | null;
          remarks: string | null;
          status: string;
          voucher_date: string;
          voucher_number: string;
        };
        Insert: {
          adjustment_type: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          jobber_id?: string | null;
          location_type: string;
          material_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          product_id?: string | null;
          quantity: number;
          reason?: string | null;
          remarks?: string | null;
          status?: string;
          voucher_date?: string;
          voucher_number: string;
        };
        Update: {
          adjustment_type?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          jobber_id?: string | null;
          location_type?: string;
          material_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          product_id?: string | null;
          quantity?: number;
          reason?: string | null;
          remarks?: string | null;
          status?: string;
          voucher_date?: string;
          voucher_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_adjustments_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_adjustments_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
          {
            foreignKeyName: "stock_adjustments_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_goods_stock";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "stock_adjustments_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "finished_products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      finished_goods_stock: {
        Row: {
          balance: number | null;
          code: string | null;
          name: string | null;
          product_id: string | null;
          total_in: number | null;
          total_out: number | null;
          uom: string | null;
        };
        Relationships: [];
      };
      jobber_stock: {
        Row: {
          adjustment: number | null;
          balance: number | null;
          jobber_code: string | null;
          jobber_id: string | null;
          jobber_name: string | null;
          material_code: string | null;
          material_id: string | null;
          material_name: string | null;
          received: number | null;
          returned: number | null;
          standard_consumed: number | null;
          uom: string | null;
          wastage: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "raw_material_ledger_jobber_id_fkey";
            columns: ["jobber_id"];
            isOneToOne: false;
            referencedRelation: "jobbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_material_ledger_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "raw_materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "raw_material_ledger_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "warehouse_stock";
            referencedColumns: ["material_id"];
          },
        ];
      };
      warehouse_stock: {
        Row: {
          balance: number | null;
          category: string | null;
          code: string | null;
          material_id: string | null;
          minimum_stock: number | null;
          name: string | null;
          total_in: number | null;
          total_out: number | null;
          uom: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      can_write: { Args: never; Returns: boolean };
      cancel_voucher: {
        Args: { _id: string; _reason: string; _voucher_type: string };
        Returns: undefined;
      };
      ensure_profile: {
        Args: { _full_name?: string };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      fg_balance: { Args: { _product: string }; Returns: number };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      jb_balance: {
        Args: { _jobber: string; _material: string };
        Returns: number;
      };
      next_voucher_number: { Args: { _prefix: string }; Returns: string };
      post_jobber_transfer: { Args: { _id: string }; Returns: undefined };
      post_material_return: { Args: { _id: string }; Returns: undefined };
      post_product_inward: { Args: { _id: string }; Returns: undefined };
      post_raw_material_inward: { Args: { _id: string }; Returns: undefined };
      post_stock_adjustment: { Args: { _id: string }; Returns: undefined };
      wh_balance: { Args: { _material: string }; Returns: number };
    };
    Enums: {
      app_role: "admin" | "store" | "management" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "store", "management", "viewer"],
    },
  },
} as const;
