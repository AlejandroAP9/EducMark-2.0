'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Send, Clock3, CheckCircle2, AlertTriangle, Users, TrendingUp, Activity, BookOpen, ChevronDown, ChevronUp, FlaskConical, ClipboardCheck, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface TicketRow {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
}

interface InstitutionSettingsRow {
    institution: string;
    help_email: string | null;
    help_whatsapp: string | null;
    license_status: string;
    license_expires_at: string | null;
}

const HELP_ARTICLES = [
    {
        module: 'Planificación',
        icon: BookOpen,
        iconColor: 'text-[var(--primary)]',
        articles: [
            { title: 'Cómo generar tu primera clase', body: 'Ingresa al Generador desde el menú lateral. Selecciona asignatura, curso, unidad y OA. En menos de 2 minutos el sistema generará una planificación completa con inicio, desarrollo, cierre, recursos y ticket de salida.' },
            { title: 'Qué es DUA/PACI', body: 'DUA (Diseño Universal para el Aprendizaje) asegura que tu clase sea accesible para todos. PACI (Plan de Adecuación Curricular Individual) se genera automáticamente cuando seleccionas una NEE distinta de "Ninguna". Está alineado al Decreto 83/2015.' },
            { title: 'Qué incluye el kit de clase', body: 'Cada generación incluye 3 archivos HTML: Planificación (secuencia didáctica completa con rúbrica), Presentación (slides interactivas con imágenes únicas) y Quiz (evaluación formativa con retroalimentación). Todo llega también por email.' },
            { title: 'Cómo editar los archivos generados', body: 'Cada archivo HTML tiene un botón "Editar" que permite modificar textos, preguntas y contenido directamente. Luego puedes guardar la versión editada con el botón "Guardar". Las presentaciones también permiten cambiar imágenes en modo edición.' },
            { title: 'Qué pasa si genero dos veces el mismo OA', body: 'Cada generación es única. Aunque selecciones el mismo OA, la planificación, actividades, preguntas e imágenes serán diferentes. Esto es útil si tienes varios cursos del mismo nivel.' },
            { title: 'Cómo funciona la alineación curricular', body: 'El sistema busca automáticamente el OA oficial en los programas del MINEDUC y extrae los indicadores de evaluación. La planificación se genera con un objetivo tridimensional (habilidad + contenido + actitud) alineado al nivel DESTACADO de Docentemás.' },
        ],
    },
    {
        module: 'Evaluaciones',
        icon: ClipboardCheck,
        iconColor: 'text-emerald-400',
        articles: [
            { title: 'Cómo crear una evaluación sumativa', body: 'Ve a Evaluaciones > Diseñar Nueva Evaluación. Define asignatura, curso y OA. El sistema generará ítems alineados al currículum. Puedes editar, reordenar y agregar ítems manualmente.' },
            { title: 'Cómo escanear hojas de respuesta', body: 'Genera la hoja de respuesta desde tu evaluación. Imprímela y repártela. Luego usa el Escáner OMR (cámara del celular o webcam) para capturar las respuestas. Los resultados se guardan automáticamente.' },
            { title: 'Para qué sirve la hoja de respuestas', body: 'La hoja de respuestas es un formulario imprimible con burbujas que los estudiantes rellenan. Incluye un código QR único que identifica la evaluación. Al escanearla, el sistema corrige automáticamente y registra las notas.' },
            { title: 'Cómo interpretar los resultados', body: 'Después del escaneo, verás el puntaje de cada estudiante, las preguntas con más errores y un semáforo de logro por OA. Rojo (<50%) requiere refuerzo urgente, amarillo (50-69%) refuerzo focalizado, verde (>=70%) dominio adecuado.' },
        ],
    },
    {
        module: 'Cuenta y Suscripción',
        icon: BarChart3,
        iconColor: 'text-blue-400',
        articles: [
            { title: 'Cuántas clases puedo generar', body: 'Depende de tu plan: Semilla (gratis) = 3 clases/mes, Copihue = 20 clases/mes, Araucaria = 35 clases/mes, Cóndor = 50 clases/mes. Los créditos se renuevan el primer día de cada mes.' },
            { title: 'Cómo cambiar mi plan', body: 'Ve a Suscripción en el menú lateral. Selecciona el plan que necesites y sigue las instrucciones de pago. El cambio se aplica inmediatamente y los créditos se ajustan al nuevo plan.' },
            { title: 'Dónde encuentro mis clases generadas', body: 'En el Dashboard principal verás tu historial de clases. Cada una tiene botones para descargar la Presentación, Planificación y Quiz. También recibes todo por email después de cada generación.' },
            { title: 'Puedo usar EducMark desde el celular', body: 'Sí. EducMark es una aplicación web progresiva (PWA). Puedes instalarla en tu celular desde el navegador y usarla como una app. Las presentaciones generadas también funcionan offline.' },
        ],
    },
];

const HelpArticles: React.FC = () => {
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [activeModule, setActiveModule] = useState(HELP_ARTICLES[0].module);
    const activeSection = HELP_ARTICLES.find(s => s.module === activeModule) || HELP_ARTICLES[0];

    return (
        <div className="glass-card-premium p-6 rounded-2xl border border-[var(--border)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--on-background)] flex items-center gap-2">
                    <BookOpen size={20} className="text-[var(--primary)]" />
                    Preguntas Frecuentes
                </h3>
                <span className="text-xs text-[var(--muted)]">{HELP_ARTICLES.reduce((s, m) => s + m.articles.length, 0)} artículos</span>
            </div>

            {/* Module tabs */}
            <div className="flex gap-2 mb-6">
                {HELP_ARTICLES.map((section) => {
                    const isActive = activeModule === section.module;
                    return (
                        <button
                            key={section.module}
                            onClick={() => { setActiveModule(section.module); setExpandedKey(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shadow-sm shadow-[var(--primary)]/10'
                                    : 'bg-[var(--card)]/40 text-[var(--muted)] border border-[var(--border)] hover:text-[var(--on-background)] hover:bg-[var(--card-hover)]/40'
                            }`}
                        >
                            <section.icon size={16} className={isActive ? 'text-[var(--primary)]' : ''} />
                            {section.module}
                        </button>
                    );
                })}
            </div>

            {/* Articles */}
            <div className="space-y-2">
                {activeSection.articles.map((article, idx) => {
                    const key = `${activeSection.module}-${article.title}`;
                    const isOpen = expandedKey === key;
                    return (
                        <div
                            key={key}
                            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                                isOpen
                                    ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5'
                                    : 'border-[var(--border)] bg-[var(--card)]/30 hover:bg-[var(--card)]/50'
                            }`}
                        >
                            <button
                                onClick={() => setExpandedKey(isOpen ? null : key)}
                                className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                            >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isOpen
                                        ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                        : 'bg-[var(--input-bg)] text-[var(--muted)]'
                                }`}>
                                    {idx + 1}
                                </span>
                                <span className={`text-sm font-medium flex-1 ${isOpen ? 'text-[var(--primary)]' : 'text-[var(--on-background)]'}`}>
                                    {article.title}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`text-[var(--muted)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {isOpen && (
                                <div className="px-4 pb-4 pl-14">
                                    <p className="text-sm text-[var(--muted)] leading-relaxed">{article.body}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export function HelpCenter() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [institution, setInstitution] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [settings, setSettings] = useState<InstitutionSettingsRow | null>(null);
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [weeklyActiveUsers, setWeeklyActiveUsers] = useState<number>(0);
    const [retention4w, setRetention4w] = useState<number>(0);
    const [moduleUsage, setModuleUsage] = useState({ planning: 0, summative: 0, omr: 0 });

    const [form, setForm] = useState({
        subject: '',
        description: '',
        category: 'general',
        priority: 'media',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return;
            setUserId(user.id);
            setUserEmail(user.email || '');

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('institution')
                .eq('user_id', user.id)
                .maybeSingle();

            const inst = profile?.institution || '';
            setInstitution(inst);

            if (inst) {
                const { data: settingData } = await supabase
                    .from('institution_settings')
                    .select('institution, help_email, help_whatsapp, license_status, license_expires_at')
                    .eq('institution', inst)
                    .maybeSingle();
                setSettings((settingData || null) as InstitutionSettingsRow | null);
            } else {
                setSettings(null);
            }

            const { data: myTickets } = await supabase
                .from('support_tickets')
                .select('id, subject, description, category, priority, status, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            setTickets((myTickets || []) as TicketRow[]);

            // Adoption metrics: institutional when possible, otherwise personal fallback.
            const now = new Date();
            const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const last28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
            const prev28 = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString();

            let candidateUserIds: string[] = [user.id];
            if (inst) {
                const { data: institutionUsers } = await supabase
                    .from('user_profiles')
                    .select('user_id')
                    .eq('institution', inst);
                const ids = (institutionUsers || []).map((u: { user_id: string }) => u.user_id).filter(Boolean);
                if (ids.length > 0) {
                    candidateUserIds = Array.from(new Set(ids));
                }
            }

            const { data: recentUsage } = await supabase
                .from('usage_logs')
                .select('user_id, created_at')
                .in('user_id', candidateUserIds)
                .gte('created_at', prev28);

            const recentRows = recentUsage || [];
            const wau = new Set(
                recentRows
                    .filter((r: { created_at: string }) => new Date(r.created_at) >= new Date(last7))
                    .map((r: { user_id: string }) => r.user_id)
            );
            setWeeklyActiveUsers(wau.size);

            const currentWindow = new Set(
                recentRows
                    .filter((r: { created_at: string }) => new Date(r.created_at) >= new Date(last28))
                    .map((r: { user_id: string }) => r.user_id)
            );
            const previousWindow = new Set(
                recentRows
                    .filter((r: { created_at: string }) => {
                        const d = new Date(r.created_at);
                        return d >= new Date(prev28) && d < new Date(last28);
                    })
                    .map((r: { user_id: string }) => r.user_id)
            );

            const retained = Array.from(previousWindow).filter((id) => currentWindow.has(id)).length;
            const retention = previousWindow.size > 0 ? Math.round((retained / previousWindow.size) * 100) : 0;
            setRetention4w(retention);

            const [{ count: planningCount }, { count: summativeCount }, { count: omrCount }] = await Promise.all([
                supabase
                    .from('generated_classes')
                    .select('*', { count: 'exact', head: true })
                    .in('user_id', candidateUserIds)
                    .gte('created_at', last28),
                supabase
                    .from('evaluations')
                    .select('*', { count: 'exact', head: true })
                    .in('user_id', candidateUserIds)
                    .gte('created_at', last28),
                supabase
                    .from('omr_results')
                    .select('*', { count: 'exact', head: true })
                    .gte('captured_at', last28),
            ]);

            setModuleUsage({
                planning: planningCount || 0,
                summative: summativeCount || 0,
                omr: omrCount || 0,
            });
        } catch (error) {
            console.error('Error loading help center data:', error);
            toast.error('No se pudo cargar el centro de ayuda.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const statusBadge = useMemo(() => {
        const status = settings?.license_status || 'trial';
        if (status === 'active') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        if (status === 'paused') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        if (status === 'expired') return 'bg-red-500/15 text-red-400 border-red-500/30';
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }, [settings?.license_status]);

    const submitTicket = async () => {
        if (!form.subject.trim() || !form.description.trim()) {
            toast.error('Asunto y descripción son obligatorios.');
            return;
        }
        if (!userId) {
            toast.error('No se pudo validar sesión.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                institution: institution || null,
                user_id: userId,
                user_email: userEmail || null,
                category: form.category,
                priority: form.priority,
                status: 'open',
                subject: form.subject.trim(),
                description: form.description.trim(),
                metadata: { source: 'dashboard_help_center' },
            };

            const { error } = await supabase.from('support_tickets').insert(payload);
            if (error) throw error;

            toast.success('Ticket enviado. Te contactaremos pronto.');
            setForm({ subject: '', description: '', category: 'general', priority: 'media' });
            fetchData();
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('No se pudo crear el ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
                <div className="h-72 rounded-2xl bg-white/5 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 -mt-2">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">Centro de Ayuda</h1>
                <p className="text-[var(--muted)] text-sm md:text-base mt-1">Soporte, artículos y seguimiento de tickets.</p>
            </div>

            {/* Artículos de Ayuda */}
            <HelpArticles />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card-premium p-6 rounded-2xl border border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--on-background)] mb-4">Crear ticket de soporte</h3>
                    <div className="space-y-3">
                        <input
                            value={form.subject}
                            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                            placeholder="Asunto"
                            className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={form.category}
                                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                                className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl"
                            >
                                <option value="general">General</option>
                                <option value="tecnico">Técnico</option>
                                <option value="pedagogico">Pedagógico</option>
                                <option value="facturacion">Facturación</option>
                                <option value="omr">OMR</option>
                            </select>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                                className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl"
                            >
                                <option value="baja">Prioridad baja</option>
                                <option value="media">Prioridad media</option>
                                <option value="alta">Prioridad alta</option>
                                <option value="critica">Prioridad crítica</option>
                            </select>
                        </div>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe el problema, evidencia y pasos para reproducir."
                            rows={5}
                            className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl"
                        />
                        <button
                            onClick={submitTicket}
                            disabled={submitting}
                            className="btn-gradient px-4 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 disabled:opacity-60"
                        >
                            <Send size={16} />
                            {submitting ? 'Enviando...' : 'Enviar ticket'}
                        </button>
                    </div>
                </div>

                <div className="glass-card-premium p-6 rounded-2xl border border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--on-background)] mb-4">Mis tickets recientes</h3>
                    <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                        {tickets.length === 0 && (
                            <p className="text-sm text-[var(--muted)]">Aún no tienes tickets registrados.</p>
                        )}
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/40">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm text-[var(--on-background)]">{ticket.subject}</p>
                                    <span className={`text-[11px] px-2 py-1 rounded-full border ${
                                        ticket.status === 'resolved' || ticket.status === 'closed'
                                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                            : ticket.status === 'in_progress'
                                                ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                                                : 'text-blue-300 border-blue-500/30 bg-blue-500/10'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{ticket.description}</p>
                                <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] mt-2">
                                    <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {new Date(ticket.created_at).toLocaleString('es-CL')}</span>
                                    <span className="inline-flex items-center gap-1"><AlertTriangle size={12} /> {ticket.priority}</span>
                                    <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> {ticket.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

