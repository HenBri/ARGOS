import * as dotenv from "dotenv";
import * as path from "path";

// Cargar variables de entorno antes de importar módulos que las consuman
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";
import { PASEO_ARANJUEZ_KNOWLEDGE } from "../src/lib/data/mall-seed-data";
import { generateEmbedding } from "../src/lib/gemini";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Error: Falta configurar GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log(
    "🚀 Iniciando script de ingesta de conocimiento para PASEO ARANJUEZ (Jarvis)..."
  );
  console.log(
    `📋 Total de elementos a procesar: ${PASEO_ARANJUEZ_KNOWLEDGE.length}`
  );

  try {
    const recordsToInsert = [];

    for (let index = 0; index < PASEO_ARANJUEZ_KNOWLEDGE.length; index++) {
      const item = PASEO_ARANJUEZ_KNOWLEDGE[index];
      process.stdout.write(
        `⏳ [${index + 1}/${PASEO_ARANJUEZ_KNOWLEDGE.length}] Vectorizando [${item.tipo_fuente}]: "${item.contenido.slice(0, 35)}..." `
      );

      const vector = await generateEmbedding(item.contenido);

      recordsToInsert.push({
        tipo_fuente: item.tipo_fuente,
        id_fuente: item.id_fuente || null,
        contenido: item.contenido,
        metadatos: item.metadatos || {},
        vector_embebido: vector,
      });

      console.log("✅ (768d)");
    }

    console.log(
      '\n💾 Insertando vectores en la tabla "base_conocimiento" de Supabase...'
    );

    // Opcional: limpiar registros previos para evitar duplicados si se re-ejecuta
    const { error: deleteErr } = await supabase
      .from("base_conocimiento")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteErr) {
      console.warn("⚠️ Aviso al limpiar base_conocimiento:", deleteErr.message);
    } else {
      console.log("🧹 Tabla base_conocimiento limpiada para inserción limpia.");
    }

    const { data, error } = await supabase
      .from("base_conocimiento")
      .insert(recordsToInsert)
      .select("id");

    if (error) {
      throw error;
    }

    console.log(
      `🎉 Éxito total: Se insertaron ${data.length} fragmentos de conocimiento con embeddings de 768 dimensiones en base_conocimiento.`
    );
  } catch (error) {
    console.error(
      "\n❌ Ocurrió un error durante la ejecución del seed:",
      error
    );
    process.exit(1);
  }
}

runSeed();
