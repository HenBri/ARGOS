import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ──────────────────────────────────────────────────────────────────────────────
// Parser minimal de frontmatter YAML
// ──────────────────────────────────────────────────────────────────────────────
function parseFrontmatter(raw: string): { frontmatter: Record<string, any>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const yamlText = match[1];
  const body = match[2].trim();
  const fm: Record<string, any> = {};

  let currentKey = '';
  let inArray = false;
  const arrayItems: string[] = [];

  yamlText.split('\n').forEach((line) => {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && inArray) {
      arrayItems.push(arrayItem[1].trim());
      return;
    }
    if (inArray) {
      fm[currentKey] = [...arrayItems];
      arrayItems.length = 0;
      inArray = false;
    }
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (val === '') {
        inArray = true;
      } else if (val === 'true') {
        fm[currentKey] = true;
      } else if (val === 'false') {
        fm[currentKey] = false;
      } else if (/^\d+$/.test(val)) {
        fm[currentKey] = parseInt(val);
      } else {
        fm[currentKey] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  });
  if (inArray && arrayItems.length) {
    fm[currentKey] = [...arrayItems];
  }
  return { frontmatter: fm, body };
}

// ──────────────────────────────────────────────────────────────────────────────
// Definir skills manualmente (para ejecutar sin depender de archivos .md en prod)
// ──────────────────────────────────────────────────────────────────────────────
const SKILLS_DIR = path.resolve(process.cwd(), 'skills');

async function loadSkillsFromDirectory(): Promise<void> {
  console.log('🚀 Cargando Skills en skills_registry de Supabase...\n');

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`❌ Directorio de skills no encontrado: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`📋 Se encontraron ${files.length} archivo(s) de Skill.\n`);

  const toUpsert: any[] = [];

  for (const file of files) {
    const filePath = path.join(SKILLS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter: fm, body } = parseFrontmatter(raw);

    if (!fm.name) {
      console.warn(`⚠️  Skipping ${file}: sin campo 'name' en frontmatter.`);
      continue;
    }

    const record = {
      nombre: fm.name as string,
      descripcion: (fm.description as string) || '',
      disparadores: (fm.triggers as string[]) || [],
      instrucciones: body,
      parametros: {
        rpc_principal: fm.rpc_principal || null,
        tables: fm.tables || [],
        requires_auth: fm.requires_auth || false,
        categoria: fm.categoria || 'general',
      },
      prioridad: (fm.priority as number) || 5,
      esta_activo: true,
    };

    toUpsert.push(record);
    console.log(`✅ Preparado: ${record.nombre} (prioridad: ${record.prioridad}, disparadores: ${record.disparadores.length})`);
  }

  if (!toUpsert.length) {
    console.log('\n⚠️  No se encontraron skills válidos para insertar.');
    return;
  }

  console.log('\n💾 Upsertando en Supabase...');

  // Upsert (insert or update) basado en el nombre
  const { data, error } = await supabase
    .from('skills_registry')
    .upsert(toUpsert, { onConflict: 'nombre' })
    .select('id, nombre');

  if (error) {
    console.error('❌ Error al insertar skills:', error.message);
    process.exit(1);
  }

  console.log(`\n🎉 ${data?.length || 0} skill(s) registrados/actualizados en skills_registry:`);
  data?.forEach((s: any) => console.log(`   • ${s.nombre} (id: ${s.id})`));
}

loadSkillsFromDirectory().catch((e) => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
