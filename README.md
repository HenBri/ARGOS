# 🛍️ Paseo Aranjuez: Paseo Points & Asistente Inteligente Jarvis Paseo

Plataforma full-stack interactiva adaptada al esquema de base de datos oficial de **Paseo Aranjuez** (Cochabamba, Bolivia), que integra:
- **Reto 1: Paseo Points**: Sistema de fidelización con acumulación de puntos (10 Bs = 1 Punto), niveles de cliente (Bronce, Plata, Oro), código QR personal y validación de canjes en comercios.
- **Reto 2: Jarvis Paseo (RAG en Tiempo Real)**: Asistente virtual impulsado por **Google Gemini 1.5 Flash**, **Supabase Vector (`base_conocimiento`)** y **Supabase Realtime WebSockets (`historial_chats`)**.

---

## 🗄️ Esquema de Base de Datos Vinculado

| Tabla | Propósito y Columnas Principales | Reto / Módulo |
| :--- | :--- | :--- |
| `perfiles` | Usuarios (`id`, `rol`, `nombre_completo`, `telefono`, `token_codigo_qr`) | Base & Identificación QR |
| `tiendas` | Directorio (`id`, `id_propietario`, `nombre`, `categoria`, `piso`, `numero_local`, `referencia_ubicacion`, `horario_atencion`) | Comercios & Asistente |
| `billeteras` | Saldo y categoría (`id_cliente`, `saldo_puntos`, `nivel`) | Reto 1: Fidelización |
| `recompensas` | Catálogo de premios (`id`, `id_tienda`, `titulo`, `descripcion`, `puntos_requeridos`, `esta_activo`) | Reto 1: Beneficios |
| `transacciones_puntos` | Historial de compras (`id_cliente`, `id_tienda`, `monto_gastado`, `puntos_ganados`) | Reto 1: Acreditación |
| `canjes` | Solicitudes y reclamos (`id_cliente`, `id_recompensa`, `puntos_utilizados`, `estado`) | Reto 1: Validación de Canje |
| `eventos` | Agenda cultural (`titulo`, `descripcion`, `fecha_inicio`, `fecha_fin`, `lugar`) | Reto 2: Actividades |
| `base_conocimiento` | RAG no estructurado (`tipo_fuente`, `id_fuente`, `contenido`, `vector_embebido`, `metadatos`) | Reto 2: Memoria Vectorial |
| `historial_chats` | Sesiones y analítica (`id_sesion`, `id_cliente`, `mensaje_usuario`, `respuesta_ia`) | Reto 2: Conversaciones |

---

## 🚀 Puesta en Marcha

### 1. Aplicar Ajustes SQL en Supabase

En el **SQL Editor** de tu proyecto Supabase existente, ejecuta el script [`supabase/setup_paseo_aranjuez.sql`](./supabase/setup_paseo_aranjuez.sql) para:
- Asegurar el índice `HNSW` en `base_conocimiento.vector_embebido`.
- Publicar `historial_chats` en `supabase_realtime` para WebSockets.
- Crear la función RPC `buscar_base_conocimiento`.
- Habilitar políticas RLS para lectura e inserción.

### 2. Configurar Variables de Entorno

Edita tu archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta-aqui
GEMINI_API_KEY=tu-gemini-api-key-aqui
```

### 3. Vectorizar el Conocimiento Inicial (Seed)

Ejecuta el script CLI o pulsa el botón **"Sincronizar RAG"** en la web:
```bash
npm run seed
```

### 4. Iniciar Servidor

```bash
npm run dev
```
Visita [http://localhost:3000](http://localhost:3000) e interactúa con **Jarvis Paseo**.
