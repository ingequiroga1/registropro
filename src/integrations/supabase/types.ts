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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string
          user_id?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          referencia: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          referencia?: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
          user_id?: string
          variant_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          referencia?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string
          created_at: string
          id: string
          product_id: string
          stock_actual: number
          stock_minimo: number
          talla: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          product_id: string
          stock_actual?: number
          stock_minimo?: number
          talla: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          stock_actual?: number
          stock_minimo?: number
          talla?: string
          user_id?: string
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
      products: {
        Row: {
          activo: boolean
          categoria: string
          codigo: string
          costo: number | null
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          marca: string | null
          modelo: string
          nombre: string
          precio_docena: number
          precio_media_docena: number
          precio_par: number
          user_id: string
        }
        Insert: {
          activo?: boolean
          categoria?: string
          codigo: string
          costo?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          marca?: string | null
          modelo: string
          nombre?: string
          precio_docena?: number
          precio_media_docena?: number
          precio_par?: number
          user_id?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          codigo?: string
          costo?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          marca?: string | null
          modelo?: string
          nombre?: string
          precio_docena?: number
          precio_media_docena?: number
          precio_par?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          meta_modelos: number
          moneda: string
          negocio: string | null
          nombre: string | null
          pares_docena: number
          pares_media_docena: number
          stock_minimo_default: number
          telefono: string | null
        }
        Insert: {
          created_at?: string
          id: string
          meta_modelos?: number
          moneda?: string
          negocio?: string | null
          nombre?: string | null
          pares_docena?: number
          pares_media_docena?: number
          stock_minimo_default?: number
          telefono?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meta_modelos?: number
          moneda?: string
          negocio?: string | null
          nombre?: string | null
          pares_docena?: number
          pares_media_docena?: number
          stock_minimo_default?: number
          telefono?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          cantidad: number
          color: string
          created_at: string
          id: string
          modelo: string
          precio_unitario: number
          product_id: string | null
          sale_id: string
          subtotal: number
          talla: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          cantidad: number
          color: string
          created_at?: string
          id?: string
          modelo: string
          precio_unitario: number
          product_id?: string | null
          sale_id: string
          subtotal: number
          talla: string
          user_id?: string
          variant_id?: string | null
        }
        Update: {
          cantidad?: number
          color?: string
          created_at?: string
          id?: string
          modelo?: string
          precio_unitario?: number
          product_id?: string | null
          sale_id?: string
          subtotal?: number
          talla?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          folio: string
          forma_pago: string
          id: string
          subtotal: number
          tipo_venta: string
          total: number
          total_pares: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          folio: string
          forma_pago: string
          id?: string
          subtotal: number
          tipo_venta: string
          total: number
          total_pares: number
          user_id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          folio?: string
          forma_pago?: string
          id?: string
          subtotal?: number
          tipo_venta?: string
          total?: number
          total_pares?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cargar_demo: { Args: never; Returns: undefined }
      mover_inventario: {
        Args: {
          p_cantidad: number
          p_color: string
          p_modo?: string
          p_product_id: string
          p_referencia?: string
          p_talla: string
          p_tipo: string
        }
        Returns: number
      }
      registrar_venta: {
        Args: {
          p_customer_id: string
          p_forma_pago: string
          p_items: Json
          p_tipo: string
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
    Enums: {},
  },
} as const
