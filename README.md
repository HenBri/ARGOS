# 🛍️ Jarvis Paseo — Asistente Virtual de Paseo Aranjuez

Asistente virtual conversacional para **Paseo Aranjuez** (Cochabamba, Bolivia), impulsado por **Google Gemini 1.5 Flash**, **Supabase Vector (`base_conocimiento`)** y **Supabase Realtime WebSockets (`historial_chats`)**, con soporte de conversación por voz (STT del navegador + TTS ElevenLabs).

---

## 🗄️ Esquema de Base de Datos Vinculado

| Tabla | Propósito y Columnas Principales |
| :--- | :--- |
| `perfiles` | Usuarios (`id`, `rol`, `nombre_completo`, `telefono`, `token_codigo_qr`) |
| `tiendas` | Directorio (`id`, `nombre`, `categoria`, `piso`, `numero_local`, `referencia_ubicacion`, `horario_atencion`) |
| `billeteras` | Saldo y categoría (`id_cliente`, `saldo_puntos`, `nivel`) |
| `recompensas` | Catálogo de premios (`id`, `titulo`, `descripcion`, `puntos_requeridos`, `esta_activo`) |
| `transacciones_puntos` | Historial de compras (`id_cliente`, `id_tienda`, `monto_gastado`, `puntos_ganados`) |
| `canjes` | Solicitudes y reclamos (`id_cliente`, `id_recompensa`, `puntos_utilizados`, `estado`) |
| `eventos` | Agenda cultural (`titulo`, `descripcion`, `fecha_inicio`, `fecha_fin`, `lugar`) |
| `base_conocimiento` | RAG no estructurado (`tipo_fuente`, `id_fuente`, `contenido`, `vector_embebido`, `metadatos`) |
| `historial_chats` | Sesiones y analítica (`id_sesion`, `id_cliente`, `mensaje_usuario`, `respuesta_ia`) |
| `skills_registry` | Skills del asistente (`nombre`, `disparadores`, `instrucciones`, `parametros`, `prioridad`) |

> Las 9 primeras tablas corresponden al esquema oficial de Paseo Aranjuez y se asumen ya existentes en tu proyecto Supabase.

---

## 🚀 Puesta en Marcha

### 1. Aplicar Scripts SQL en Supabase

En el **SQL Editor** de tu proyecto Supabase, ejecuta en este orden:

1. [`supabase/setup_paseo_aranjuez.sql`](./supabase/setup_paseo_aranjuez.sql)
   - Asegura el índice `HNSW` en `base_conocimiento.vector_embebido`.
   - Publica `historial_chats` en `supabase_realtime` para WebSockets.
   - Crea la función RPC `buscar_base_conocimiento`.
   - Habilita políticas RLS para lectura e inserción.
2. [`supabase/skills_migration.sql`](./supabase/skills_migration.sql)
   - Crea la tabla `skills_registry` y la RPC `buscar_skill_por_disparador`.

### 2. Configurar Variables de Entorno

Copia `.env.local.example` a `.env.local` y edítalo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta-aqui
GEMINI_API_KEY=tu-gemini-api-key-aqui

# Opcional: voz (si no se configura, se usa SpeechSynthesis del navegador)
ELEVENLABS_API_KEY=
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=
```

### 3. Vectorizar el Conocimiento Inicial (Seed)

Ejecuta el script CLI o pulsa el botón **"Sincronizar RAG"** en la web:
```bash
npm run seed
```

### 4. Cargar los Skills del Asistente

```bash
npm run seed:skills
```
Cada archivo Markdown de [`skills/`](./skills) se sube (upsert) a `skills_registry`.

### 5. Iniciar Servidor

```bash
npm run dev
```
Visita [http://localhost:3000](http://localhost:3000) e interactúa con **Jarvis Paseo**.

---

## 🧠 Arquitectura del Asistente

```
src/app/page.tsx ──► components/chat/ChatWidget
                        │  (fetch) ──► /api/chat    ──► lib/context/builder ──► lib/gemini (Gemini)
                        │                             └─► lib/skills/*       ──► RPCs de Supabase
                        │  (fetch) ──► /api/messages ──► historial_chats
                        │  (fetch) ──► /api/ingest   ──► base_conocimiento
                        │  (Realtime) ─► supabaseClient ─► historial_chats (WebSockets)
                        └─► hooks/useVoiceConversation ─► /api/tts (ElevenLabs)
```

| Ruta | Función |
| :--- | :--- |
| `POST /api/chat` | Construye contexto (Skill + RAG + Historial), llama a Gemini y persiste en `historial_chats` |
| `GET /api/messages` | Devuelve el historial de una sesión |
| `POST /api/ingest` | Vectoriza el corpus y lo inserta en `base_conocimiento` |
| `POST /api/tts` | Sintetiza voz con ElevenLabs (con fallback al navegador) |
| `/api/skills` | CRUD de `skills_registry` |

---

## 📦 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar build de producción |
| `npm run seed` | Vectorizar `mall-seed-data` en `base_conocimiento` |
| `npm run seed:skills` | Subir `skills/*.md` a `skills_registry` |
| `npm run seed:all` | Ambos seeds |
