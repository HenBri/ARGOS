import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-mall.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-service-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Supabase Server] Variables de Supabase no configuradas. Usando cliente fallback para build.'
    );
  }
}

/**
 * Cliente de Supabase para su uso seguro en el servidor (API Route Handlers y Server Actions).
 * Utiliza la Service Role Key para operaciones privilegiadas (ej: ingesta de embeddings o RAG).
 */
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
