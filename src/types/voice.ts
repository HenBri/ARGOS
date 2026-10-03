// ============================================================================
// TIPOS PARA EL SISTEMA DE VOZ DE JARVIS PASEO
// ============================================================================

/**
 * Estado del reconocimiento de voz (Speech-to-Text).
 */
export interface SpeechRecognitionState {
  /** Si el micrófono está activamente escuchando */
  isListening: boolean;
  /** Texto final reconocido tras silencio/fin de habla */
  transcript: string;
  /** Texto parcial en tiempo real mientras el usuario habla */
  interimTranscript: string;
  /** Nivel de confianza del reconocimiento (0-1) */
  confidence: number;
  /** Error actual, null si no hay error */
  error: string | null;
  /** Si el navegador soporta Web Speech API */
  isSupported: boolean;
}

/**
 * Opciones de configuración para Speech-to-Text.
 */
export interface SpeechRecognitionOptions {
  /** Código de idioma (default: 'es-BO') */
  lang?: string;
  /** Si debe seguir escuchando tras detectar silencio (default: false) */
  continuous?: boolean;
  /** Si debe enviar resultados parciales (default: true) */
  interimResults?: boolean;
  /** Callback cuando se obtiene un resultado final */
  onResult?: (text: string) => void;
  /** Callback cuando se detecta silencio / fin de habla */
  onSilence?: () => void;
  /** Callback cuando ocurre un error */
  onError?: (error: string) => void;
}

/**
 * Estado del Text-to-Speech.
 */
export interface TextToSpeechState {
  /** Si Jarvis está hablando actualmente */
  isSpeaking: boolean;
  /** Si hay audio en cola esperando a reproducirse */
  isQueued: boolean;
  /** Progreso del audio actual (0-1) */
  progress: number;
  /** Si se está usando la API Cloud (true) o browser (false) */
  isCloudTTS: boolean;
  /** Error actual */
  error: string | null;
}

/**
 * Opciones para sintetizar voz.
 */
export interface TTSSynthesizeOptions {
  /** Texto a convertir en voz */
  text: string;
  /** ID de la voz de Google Cloud TTS */
  voiceId?: string;
  /** Velocidad de habla (0.5 - 2.0, default: 1.05) */
  speed?: number;
  /** Tono (-20.0 a 20.0, default: 0.0) */
  pitch?: number;
}

/**
 * Respuesta del endpoint /api/tts.
 */
export interface TTSApiResponse {
  /** Audio en formato base64 (cuando se devuelve como JSON) */
  audioContent?: string;
  /** Formato del audio */
  contentType: string;
  /** Error si falla */
  error?: string;
}

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
  /** ID de la voz de Google Cloud TTS */
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

/**
 * Opciones para el hook useVoiceConversation.
 */
export interface VoiceConversationOptions {
  /** Session ID del chat actual */
  sessionId: string | null;
  /** Callback cuando el usuario envía un mensaje por voz */
  onMessageSent?: (text: string) => void;
  /** Callback cuando Jarvis responde */
  onResponseReceived?: (text: string) => void;
  /** Si debe reactivar STT automáticamente tras TTS (default: true) */
  autoReactivate?: boolean;
  /** Si el usuario puede interrumpir a Jarvis hablando (default: true) */
  interruptible?: boolean;
}

// ============================================================================
// VOCES DISPONIBLES
// ============================================================================

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  languageCode: string;
  isDefault?: boolean;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'es-US-Studio-B',
    name: 'Jarvis (Profesional)',
    gender: 'male',
    style: 'Profesional, cálido',
    languageCode: 'es-US',
    isDefault: true,
  },
  {
    id: 'es-US-Neural2-B',
    name: 'Jarvis Natural',
    gender: 'male',
    style: 'Natural, conversacional',
    languageCode: 'es-US',
  },
  {
    id: 'es-US-Studio-A',
    name: 'Aria (Profesional)',
    gender: 'female',
    style: 'Profesional, clara',
    languageCode: 'es-US',
  },
  {
    id: 'es-US-Casual-K',
    name: 'Jarvis Casual',
    gender: 'male',
    style: 'Informal, amigable',
    languageCode: 'es-US',
  },
];

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  voiceId: 'es-US-Studio-B',
  speed: 1.05,
  autoListen: true,
  readAloud: true,
  volume: 0.85,
};

// ============================================================================
// PERMISOS Y SOPORTE
// ============================================================================

export interface VoiceSupportInfo {
  /** Si el navegador soporta SpeechRecognition */
  sttSupported: boolean;
  /** Si el navegador soporta SpeechSynthesis */
  browserTTSSupported: boolean;
  /** Si hay micrófono disponible */
  microphoneAvailable: boolean;
  /** Si se tiene API key para Google Cloud TTS */
  cloudTTSAvailable: boolean;
  /** Navegador detectado */
  browser: string;
}
