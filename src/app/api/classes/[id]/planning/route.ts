/**
 * GET /api/classes/[id]/planning
 *
 * Resuelve planning_blocks de una clase con fallback a planning_sequences.
 *
 * Por qué existe:
 *   generated_classes.planning_blocks está vacío {} en la mayoría de clases antiguas.
 *   Los datos estructurados reales viven en planning_sequences, poblada por el
 *   workflow n8n "EducMark Pro Max IP" con user_id + created_at (sin FK a
 *   generated_classes.id). Este endpoint hace el match por cercanía temporal.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface PlanningBlocks {
    objective: string;
    indicators: string[];
    inicio: string;
    desarrollo: string;
    cierre: string;
    resources: string[];
    planningText?: string;
}

interface SecuenciaPlanificacion {
    obj_clase?: string;
    inicio?: string;
    desarrollo?: string;
    cierre?: string;
    indicadores?: string[];
    recursos?: string[];
}

const EMPTY_BLOCKS: PlanningBlocks = {
    objective: '',
    indicators: [],
    inicio: '',
    desarrollo: '',
    cierre: '',
    resources: [],
    planningText: '',
};

function isBlocksEmpty(b: unknown): boolean {
    if (!b || typeof b !== 'object') return true;
    const o = b as Record<string, unknown>;
    const hasText =
        (typeof o.objective === 'string' && o.objective.trim().length > 0) ||
        (typeof o.inicio === 'string' && o.inicio.trim().length > 0) ||
        (typeof o.desarrollo === 'string' && o.desarrollo.trim().length > 0) ||
        (typeof o.cierre === 'string' && o.cierre.trim().length > 0) ||
        (typeof o.planningText === 'string' && o.planningText.trim().length > 0);
    return !hasText;
}

function mapSecuenciaToBlocks(s: SecuenciaPlanificacion): PlanningBlocks {
    return {
        objective: s.obj_clase || '',
        indicators: Array.isArray(s.indicadores) ? s.indicadores.map(String) : [],
        inicio: s.inicio || '',
        desarrollo: s.desarrollo || '',
        cierre: s.cierre || '',
        resources: Array.isArray(s.recursos) ? s.recursos.map(String) : [],
        planningText: '',
    };
}

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id: classId } = await ctx.params;
    if (!classId) {
        return NextResponse.json({ error: 'classId requerido' }, { status: 400 });
    }

    // Auth: obtener user desde cookie session
    const cookieStore = await cookies();
    const ssr = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { /* read-only */ },
            },
        }
    );

    const {
        data: { user },
    } = await ssr.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Admin client para cross-table reads (planning_sequences requiere service_role)
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Leer la clase. Verificar ownership.
    const { data: classRow, error: classErr } = await admin
        .from('generated_classes')
        .select('id, user_id, planning_blocks, created_at')
        .eq('id', classId)
        .maybeSingle();

    if (classErr || !classRow) {
        return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }
    if (classRow.user_id !== user.id) {
        return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    const primary = classRow.planning_blocks as PlanningBlocks | null;

    // 2. Si planning_blocks ya tiene datos, devolver eso directo.
    if (!isBlocksEmpty(primary)) {
        return NextResponse.json({
            source: 'planning_blocks',
            blocks: { ...EMPTY_BLOCKS, ...(primary || {}) },
        });
    }

    // 3. Fallback: buscar planning_sequences más cercana en tiempo (±48h)
    // No hay FK, matchemos por user_id + created_at proximity.
    const classCreated = new Date(classRow.created_at).getTime();
    const windowMs = 48 * 60 * 60 * 1000;

    const { data: seqs, error: seqErr } = await admin
        .from('planning_sequences')
        .select('secuencia_planificacion, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(classCreated - windowMs).toISOString())
        .lte('created_at', new Date(classCreated + windowMs).toISOString())
        .order('created_at', { ascending: false });

    if (seqErr) {
        console.warn('[classes/planning] planning_sequences error:', seqErr.message);
    }

    // Elegir la secuencia con timestamp más cercano al de la clase
    const nearest = (seqs || [])
        .map((s) => ({
            seq: s.secuencia_planificacion as SecuenciaPlanificacion | null,
            diff: Math.abs(new Date(s.created_at).getTime() - classCreated),
        }))
        .filter((s) => s.seq && Object.keys(s.seq || {}).length > 0)
        .sort((a, b) => a.diff - b.diff)[0];

    if (nearest && nearest.seq) {
        return NextResponse.json({
            source: 'planning_sequences',
            blocks: mapSecuenciaToBlocks(nearest.seq),
        });
    }

    // 4. Sin datos en ninguna tabla
    return NextResponse.json({
        source: 'empty',
        blocks: EMPTY_BLOCKS,
    });
}
