import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini';
import { PASEO_ARANJUEZ_KNOWLEDGE } from '@/lib/data/mall-seed-data';
import { IngestItem, IngestResponse } from '@/types/chat';
import { Json } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Route Handler para procesar la ingesta y vectorización de conocimiento
 * en la tabla oficial `base_conocimiento` de Paseo Aranjuez.
 */
export async function POST(req: NextRequest) {
  try {
    let itemsToIngest: IngestItem[] = [];

    const body = await req.json().catch(() => ({}));
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      itemsToIngest = body.items;
    } else {
      itemsToIngest = PASEO_ARANJUEZ_KNOWLEDGE;
    }

    const insertedRows: Array<{
      tipo_fuente: string;
      id_fuente?: string | null;
      contenido: string;
      vector_embebido: number[];
      metadatos: Json | null;
    }> = [];

    for (let i = 0; i < itemsToIngest.length; i++) {
      const item = itemsToIngest[i];
      const embedding = await generateEmbedding(item.contenido);

      insertedRows.push({
        tipo_fuente: item.tipo_fuente,
        id_fuente: item.id_fuente || null,
        contenido: item.contenido,
        vector_embebido: embedding,
        metadatos: (item.metadatos as Json) || null,
      });
    }

    // Insertar vectores en la tabla base_conocimiento de Supabase
    const { data, error } = await (supabaseServer
      .from('base_conocimiento') as any)
      .insert(insertedRows)
      .select('id');

    if (error) {
      console.error('[Ingest Error Supabase]:', error);
      return NextResponse.json<IngestResponse>(
        {
          success: false,
          insertedCount: 0,
          message: `Error al insertar en base_conocimiento: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json<IngestResponse>({
      success: true,
      insertedCount: data?.length || insertedRows.length,
      message: `Se han indexado exitosamente ${insertedRows.length} registros en base_conocimiento para Jarvis Paseo.`,
    });
  } catch (error) {
    console.error('[Ingest Error General]:', error);
    return NextResponse.json<IngestResponse>(
      {
        success: false,
        insertedCount: 0,
        message: error instanceof Error ? error.message : 'Error interno al procesar la ingesta.',
      },
      { status: 500 }
    );
  }
}
