export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Interfaces para uso en la aplicación
export interface Perfil {
  id: string;
  rol: string;
  nombre_completo: string;
  telefono: string | null;
  token_codigo_qr: string | null;
  creado_en: string | null;
}

export interface Tienda {
  id: string;
  id_propietario: string | null;
  nombre: string;
  categoria: string | null;
  piso: number | null;
  numero_local: string | null;
  referencia_ubicacion: string | null;
  horario_atencion: string | null;
  creado_en: string | null;
}

export interface Billetera {
  id_cliente: string;
  saldo_puntos: number;
  nivel: string | null;
  actualizado_en: string | null;
}

export interface Recompensa {
  id: string;
  id_tienda: string | null;
  titulo: string;
  descripcion: string | null;
  puntos_requeridos: number;
  esta_activo: boolean | null;
  creado_en: string | null;
}

export interface TransaccionPuntos {
  id: string;
  id_cliente: string;
  id_tienda: string;
  monto_gastado: number;
  puntos_ganados: number;
  creado_en: string | null;
}

export interface Canje {
  id: string;
  id_cliente: string;
  id_recompensa: string;
  puntos_utilizados: number;
  estado: string | null;
  creado_en: string | null;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string | null;
  creado_en: string | null;
}

export interface BaseConocimiento {
  id: string;
  tipo_fuente: string;
  id_fuente: string | null;
  contenido: string;
  vector_embebido: number[] | string | null;
  metadatos: Json | null;
  creado_en: string | null;
}

export interface MatchedConocimiento {
  id: string;
  tipo_fuente: string;
  id_fuente: string | null;
  contenido: string;
  metadatos: Json | null;
  similarity: number;
}

export interface HistorialChat {
  id: string;
  id_cliente: string | null;
  id_sesion: string;
  mensaje_usuario: string;
  respuesta_ia: string;
  creado_en: string | null;
}

// Estructura oficial del esquema de base de datos Supabase v2
export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          rol: string;
          nombre_completo: string;
          telefono: string | null;
          token_codigo_qr: string | null;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          rol: string;
          nombre_completo: string;
          telefono?: string | null;
          token_codigo_qr?: string | null;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          rol?: string;
          nombre_completo?: string;
          telefono?: string | null;
          token_codigo_qr?: string | null;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      tiendas: {
        Row: {
          id: string;
          id_propietario: string | null;
          nombre: string;
          categoria: string | null;
          piso: number | null;
          numero_local: string | null;
          referencia_ubicacion: string | null;
          horario_atencion: string | null;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          id_propietario?: string | null;
          nombre: string;
          categoria?: string | null;
          piso?: number | null;
          numero_local?: string | null;
          referencia_ubicacion?: string | null;
          horario_atencion?: string | null;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          id_propietario?: string | null;
          nombre?: string;
          categoria?: string | null;
          piso?: number | null;
          numero_local?: string | null;
          referencia_ubicacion?: string | null;
          horario_atencion?: string | null;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      billeteras: {
        Row: {
          id_cliente: string;
          saldo_puntos: number;
          nivel: string | null;
          actualizado_en: string | null;
        };
        Insert: {
          id_cliente: string;
          saldo_puntos: number;
          nivel?: string | null;
          actualizado_en?: string | null;
        };
        Update: {
          id_cliente?: string;
          saldo_puntos?: number;
          nivel?: string | null;
          actualizado_en?: string | null;
        };
        Relationships: [];
      };
      recompensas: {
        Row: {
          id: string;
          id_tienda: string | null;
          titulo: string;
          descripcion: string | null;
          puntos_requeridos: number;
          esta_activo: boolean | null;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          id_tienda?: string | null;
          titulo: string;
          descripcion?: string | null;
          puntos_requeridos: number;
          esta_activo?: boolean | null;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          id_tienda?: string | null;
          titulo?: string;
          descripcion?: string | null;
          puntos_requeridos?: number;
          esta_activo?: boolean | null;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      transacciones_puntos: {
        Row: {
          id: string;
          id_cliente: string;
          id_tienda: string;
          monto_gastado: number;
          puntos_ganados: number;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          id_cliente: string;
          id_tienda: string;
          monto_gastado: number;
          puntos_ganados: number;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          id_cliente?: string;
          id_tienda?: string;
          monto_gastado?: number;
          puntos_ganados?: number;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      canjes: {
        Row: {
          id: string;
          id_cliente: string;
          id_recompensa: string;
          puntos_utilizados: number;
          estado: string | null;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          id_cliente: string;
          id_recompensa: string;
          puntos_utilizados: number;
          estado?: string | null;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          id_cliente?: string;
          id_recompensa?: string;
          puntos_utilizados?: number;
          estado?: string | null;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      eventos: {
        Row: {
          id: string;
          titulo: string;
          descripcion: string | null;
          fecha_inicio: string;
          fecha_fin: string;
          lugar: string | null;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descripcion?: string | null;
          fecha_inicio: string;
          fecha_fin: string;
          lugar?: string | null;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descripcion?: string | null;
          fecha_inicio?: string;
          fecha_fin?: string;
          lugar?: string | null;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      base_conocimiento: {
        Row: {
          id: string;
          tipo_fuente: string;
          id_fuente: string | null;
          contenido: string;
          vector_embebido: number[] | string | null;
          metadatos: Json | null;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          tipo_fuente: string;
          id_fuente?: string | null;
          contenido: string;
          vector_embebido?: number[] | string | null;
          metadatos?: Json | null;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          tipo_fuente?: string;
          id_fuente?: string | null;
          contenido?: string;
          vector_embebido?: number[] | string | null;
          metadatos?: Json | null;
          creado_en?: string | null;
        };
        Relationships: [];
      };
      historial_chats: {
        Row: {
          id: string;
          id_cliente: string | null;
          id_sesion: string;
          mensaje_usuario: string;
          respuesta_ia: string;
          creado_en: string | null;
        };
        Insert: {
          id?: string;
          id_cliente?: string | null;
          id_sesion: string;
          mensaje_usuario: string;
          respuesta_ia: string;
          creado_en?: string | null;
        };
        Update: {
          id?: string;
          id_cliente?: string | null;
          id_sesion?: string;
          mensaje_usuario?: string;
          respuesta_ia?: string;
          creado_en?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      buscar_base_conocimiento: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          tipo_fuente: string;
          id_fuente: string | null;
          contenido: string;
          metadatos: Json | null;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
