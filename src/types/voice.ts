// ============================================================================
// TIPOS PARA EL SISTEMA DE VOZ DE JARVIS PASEO
// ============================================================================

// ============================================================================
// MODO CONVERSACIÓN CONTINUA
// ============================================================================

/**
 * Estado general del modo conversación por voz.
 */
export type VoiceConversationPhase =
  | 'idle'        // Esperando activación
  | 'listening'   // STT activo, usuario hablando
  | 'processing'  // Enviando mensaje a Jarvis
  | 'speaking'    // TTS reproduciendo respuesta
  | 'paused'      // Conversación pausada temporalmente
  | 'error';      // Error recuperable

export interface VoiceConversationState {
  /** Fase actual del ciclo de conversación */
  phase: VoiceConversationPhase;
  /** Si el modo conversación continua está activo */
  isVoiceMode: boolean;
  /** Si el micrófono está escuchando */
  isListening: boolean;
  /** Si Jarvis está hablando */
  isSpeaking: boolean;
  /** Transcripción actual (parcial o final) */
  currentTranscript: string;
  /** Número de turnos de conversación en esta sesión de voz */
  turnCount: number;
  /** Error recuperable */
  error: string | null;
}

/**
 * Preferencias de voz del usuario (persistidas en localStorage).
 */
export interface VoicePreferences {
  /** ID de la voz de ElevenLabs */
  voiceId: string;
  /** Velocidad de habla (0.5 - 2.0) */
  speed: number;
  /** Si debe reactivar el micrófono tras la respuesta de Jarvis */
  autoListen: boolean;
  /** Si debe leer en voz alta también las respuestas de texto */
  readAloud: boolean;
  /** Volumen del audio (0-1) */
  volume: number;
}

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 't3eeeqhBjrUqcrPvDqUn',
  speed: 1.05,
  autoListen: true,
  readAloud: true,
  volume: 0.85,
};
