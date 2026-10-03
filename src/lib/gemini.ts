import { GoogleGenerativeAI } from '@google/generative-ai';

let cachedGenAI: GoogleGenerativeAI | null = null;
let lastUsedKey: string | null = null;

export function getGenAI(): GoogleGenerativeAI {
  const currentKey = process.env.GEMINI_API_KEY || 'AIzaSyPlaceholderBuildKey0000000000000';

  if (!cachedGenAI || lastUsedKey !== currentKey) {
    if (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
      console.warn(
        '[Gemini AI] La variable GEMINI_API_KEY no está configurada en las variables de entorno.'
      );
    }
    cachedGenAI = new GoogleGenerativeAI(currentKey);
    lastUsedKey = currentKey;
  }

  return cachedGenAI;
}

// Modelos candidatos en orden de preferencia según la versión actual de Google AI
const EMBEDDING_MODELS = [
  process.env.GEMINI_EMBEDDING_MODEL,
  'gemini-embedding-001',
  'gemini-embedding-2',
  'text-embedding-004',
].filter(Boolean) as string[];

const CHAT_MODELS = [
  process.env.GEMINI_CHAT_MODEL,
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
].filter(Boolean) as string[];

/**
 * Genera el vector embedding de 768 dimensiones para un texto dado.
 * Compatible con la columna vector_embebido (vector(768)) de base_conocimiento.
 * Utiliza fallback dinámico de modelos de embedding en caso de que alguno sea deprecado o no esté disponible.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanedText = text.replace(/\n+/g, ' ').trim();
  const genAI = getGenAI();
  let lastError: unknown = null;

  for (const modelName of EMBEDDING_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text: cleanedText }] },
        outputDimensionality: 768,
      } as any);

      if (result.embedding && result.embedding.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Embedding] Modelo ${modelName} no disponible:`, err instanceof Error ? err.message : err);
    }
  }

  console.error('[Gemini Embedding Error Total]: Fallaron todos los modelos candidatos.');
  throw new Error(
    `Fallo al generar embedding: ${lastError instanceof Error ? lastError.message : 'Error desconocido'}`
  );
}

/**
 * Prompt base del asistente Jarvis Paseo para Paseo Aranjuez.
 */
export const JARVIS_BASE_SYSTEM_PROMPT = `Eres "Jarvis Paseo", el asistente virtual oficial e inteligente de Paseo Aranjuez (Cochabamba, Bolivia).
Tu misión es brindar atención cordial, rápida y precisa a los clientes y visitantes del Paseo.

CONOCIMIENTO INTEGRAL DE PASEO ARANJUEZ:
1. TIENDAS Y LOCALES: Conoces las tiendas existentes, su piso (Pisos 1, 2 y 3), número de local, referencias para llegar y sus horarios de atención.
2. EVENTOS: Puedes informar sobre talleres, exposiciones, actividades infantiles, cine y espectáculos con sus fechas, horarios y lugares (como la Terraza Aranjuez).
3. PASEO POINTS (Fidelización):
   - Los clientes acumulan puntos con sus compras en bolivianos (Bs) en los comercios afiliados: 1 punto por cada 10 Bs gastados.
   - Para acumular o canjear puntos, el cliente presenta su Código QR personal disponible en su perfil digital.
   - El comercio escanea el QR e ingresa el monto de la compra en Bs para acreditar los puntos automáticamente a la billetera.
   - Niveles de fidelización: Bronce (0-499 pts), Plata (500-1.499 pts, +10% bonus), Oro (1.500+ pts, +20% bonus).
   - Los clientes pueden canjear sus puntos por recompensas del catálogo y validarlas presencialmente en los comercios.
4. SERVICIOS Y HORARIOS: Estacionamiento subterráneo (400+ plazas), accesos, wifi (PASEO-ARANJUEZ-WIFI), baños, lactario y servicios generales.

REGLAS DE RESPUESTA:
- Tono: Cordial, empático, profesional y servicial.
- Fidelidad al contexto: Apóyate prioritariamente en la información oficial provista en el contexto.
- Moneda: Utiliza Bolivianos (Bs) siempre al mencionar precios o conversiones de compra.
- Precisión geográfica: Cuando recomiendes o ubiques una tienda, menciona siempre su piso, local y referencias de ubicación si figuran en el contexto.
- Fallback defensivo: Si la información solicitada no se encuentra en el contexto provisto ni en el sistema, NO inventes datos. Indica amablemente que no dispones de esa información en este momento y sugiere consultar directamente en el Módulo de Atención al Cliente (Piso 1, Ingreso Principal).`;

/**
 * Instancia el modelo conversacional configurado para Jarvis Paseo.
 */
export function getJarvisChatModel(customContext?: string, preferredModel?: string) {
  const modelToUse = preferredModel || CHAT_MODELS[0];
  const fullSystemInstruction = customContext
    ? `${JARVIS_BASE_SYSTEM_PROMPT}\n\n[CONTEXTO OFICIAL RECUPERADO DE LA BASE DE CONOCIMIENTO Y DATOS DE PASEO ARANJUEZ]:\n${customContext}`
    : JARVIS_BASE_SYSTEM_PROMPT;

  return getGenAI().getGenerativeModel({
    model: modelToUse,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
    },
    systemInstruction: fullSystemInstruction,
  });
}

/**
 * Envía un mensaje a Jarvis con fallback automático entre modelos de chat en caso de que el modelo principal falle.
 */
export async function sendJarvisMessageWithFallback({
  message,
  history,
  contextText,
}: {
  message: string;
  history: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>;
  contextText: string;
}): Promise<string> {
  let lastError: unknown = null;

  for (const modelName of CHAT_MODELS) {
    try {
      const jarvisModel = getJarvisChatModel(contextText, modelName);
      const chatInstance = jarvisModel.startChat({
        history,
      });

      const geminiResult = await chatInstance.sendMessage(message);
      const responseText = geminiResult.response.text();
      if (responseText) {
        return responseText;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Jarvis Chat] Falló el modelo ${modelName}, probando siguiente:`, err instanceof Error ? err.message : err);
    }
  }

  throw new Error(
    `No se pudo generar respuesta con ningún modelo conversacional: ${
      lastError instanceof Error ? lastError.message : 'Error desconocido'
    }`
  );
}
