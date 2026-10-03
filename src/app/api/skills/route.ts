import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateSkillRequest, UpdateSkillRequest } from '@/types/skills';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/skills — Listar todos los skills
export async function GET() {
  const { data, error } = await supabase
    .from('skills_registry')
    .select('*')
    .order('prioridad', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ skills: data || [], total: (data || []).length });
}

// POST /api/skills — Crear un nuevo skill
export async function POST(req: NextRequest) {
  try {
    const body: CreateSkillRequest = await req.json();

    if (!body.nombre || !body.instrucciones || !body.disparadores?.length) {
      return NextResponse.json(
        { error: 'nombre, instrucciones y al menos un disparador son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('skills_registry')
      .insert({
        nombre: body.nombre.trim(),
        descripcion: body.descripcion,
        disparadores: body.disparadores,
        instrucciones: body.instrucciones,
        parametros: body.parametros || {},
        prioridad: body.prioridad ?? 5,
        esta_activo: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, skill: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// PUT /api/skills — Actualizar un skill existente
export async function PUT(req: NextRequest) {
  try {
    const body: UpdateSkillRequest = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { id, ...updates } = body;
    const { data, error } = await supabase
      .from('skills_registry')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, skill: data });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE /api/skills?id=uuid — Eliminar un skill
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id query param required' }, { status: 400 });
  }

  const { error } = await supabase.from('skills_registry').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: `Skill ${id} eliminado` });
}
