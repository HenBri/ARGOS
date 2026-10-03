import { HistorialChat, MatchedConocimiento } from './database';

export interface ChatUIMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  idCliente?: string;
}

export interface SendMessageResponse {
  sessionId: string;
  record: HistorialChat;
  sources: MatchedConocimiento[];
}

export interface IngestItem {
  tipo_fuente: 'tienda' | 'evento' | 'recompensa' | 'general' | 'politica';
  id_fuente?: string;
  contenido: string;
  metadatos?: Record<string, unknown>;
}

export interface IngestResponse {
  success: boolean;
  insertedCount: number;
  message: string;
}
