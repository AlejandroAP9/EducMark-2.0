'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import '@/features/dashboard/styles/dashboard.css';
import '@/features/admin/styles/admin.css';
import { createClient } from '@/lib/supabase/client';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { ReferralButton } from '@/features/dashboard/components/ReferralProgram';
import { NotificationBell } from '@/features/dashboard/components/NotificationBell';
import { Modal, Button } from '@/shared/components/ui/UIComponents';
import { toast } from 'sonner';
import { Menu, Search, X, ArrowRight, Moon, Loader2, Wand2 } from 'lucide-react';

function CreditsBadge() {
    const router = useRouter();
    const { credits, classesLimit } = useSubscriptionStore();
    const percentage = classesLimit > 0 ? (credits.used / classesLimit) * 100 : 0;
    const colorClass = percentage >= 80 ? 'text-red-400 bg-red-500/10 border-red-500/20' : percentage >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

    return (
        <button
            onClick={() => router.push('/dashboard/subscription')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors hover:opacity-80 ${colorClass}`}
            title="Uso de créditos"
        >
            <Wand2 size={13} />
            <span>{credits.used}/{classesLimit}</span>
        </button>
    );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: string; objetivo_clase: string | null; topic: string | null; asignatura: string | null; curso: string | null }>>([]);
    const [showResults, setShowResults] = useState(false);
    const searchControllerRef = useRef<AbortController | null>(null);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // Subscription context
    const { planName, fullName } = useSubscriptionStore();

    // Welcome/Ebook Modal State
    const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const checkEbookStatus = async (userId: string) => {
        try {
            const localDismissed = localStorage.getItem('educmark_welcome_shown');
            if (localDismissed === 'true') return;

            const { data } = await supabase
                .from('usuarios_crm')
                .select('descarga_ebook')
                .eq('user_id', userId)
                .maybeSingle();

            const hasAction = data?.descarga_ebook === 'SI' || data?.descarga_ebook === 'NO';
            if (hasAction) {
                localStorage.setItem('educmark_welcome_shown', 'true');
            } else {
                setWelcomeModalOpen(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const downloadGuide = async () => {
        setIsDownloading(true);
        try {
            const fileUrl = process.env.NEXT_PUBLIC_EBOOK_URL || "/api/ebook-download";
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'De_12_Horas_a_5_Minutos_EducMark.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            toast.error("Hubo un error al iniciar la descarga. Por favor intenta nuevamente.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleEbookAction = async (status: 'SI' | 'NO') => {
        if (status === 'SI') await downloadGuide();

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: existingRow } = await supabase
                .from('usuarios_crm')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (existingRow) {
                await supabase.from('usuarios_crm').update({ descarga_ebook: status }).eq('user_id', session.user.id);
            } else {
                await supabase.from('usuarios_crm').insert({ user_id: session.user.id, descarga_ebook: status, email: session.user.email });
            }
        }
        localStorage.setItem('educmark_welcome_shown', 'true');
        setWelcomeModalOpen(false);
    };

    useEffect(() => {
        // Clear welcome param from URL when it appears, but keep ebook-status check out of here
        if (searchParams.get('welcome') === 'true') {
            window.history.replaceState({}, '', pathname);
        }
    }, [searchParams, pathname]);

    useEffect(() => {
        // Ebook welcome check runs ONCE per layout mount, not on every navigation.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) checkEbookStatus(session.user.id);
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('user_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (!profile) {
                    await supabase.from('user_profiles').insert({
                        user_id: session.user.id,
                        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
                        email: session.user.email,
                        institution: '',
                        role: 'profesor',
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }
            setLoading(false);
        });
    }, [supabase]);

    // Search Logic
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchControllerRef.current?.abort();

        if (query.length > 2) {
            const controller = new AbortController();
            searchControllerRef.current = controller;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { data, error } = await supabase
                    .from('generated_classes')
                    .select('id, objetivo_clase, topic, asignatura, curso')
                    .eq('user_id', session.user.id)
                    .or(`objetivo_clase.ilike.%${query}%,topic.ilike.%${query}%,asignatura.ilike.%${query}%`)
                    .order('created_at', { ascending: false })
                    .limit(5)
                    .abortSignal(controller.signal);

                if (error) throw error;
                setSearchResults(data || []);
                setShowResults(true);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return;
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    const handleResultClick = (classId: string) => {
        setShowResults(false);
        setSearchQuery('');
        router.push(`/dashboard/kit-result?id=${classId}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">Cargando...</div>;

    return (
        <div className="app-container">
            <div className="background-mesh">
                <div className="aurora-orb aurora-orb-primary" style={{width: '500px', height: '500px', top: '10%', left: '60%'}}></div>
                <div className="aurora-orb aurora-orb-secondary" style={{width: '400px', height: '400px', bottom: '10%', left: '20%'}}></div>
            </div>

            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            <main className="main-content">
                <header className="top-header">
                    <div className="mobile-toggle block md:hidden mr-4">
                        <button onClick={() => setMobileOpen(true)}>
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="flex-1 md:hidden"></div>

                    <button className="md:hidden text-2xl mr-4" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
                        <Search size={24} />
                    </button>

                    <div className={`header-search ${mobileSearchOpen ? 'mobile-active' : ''}`}>
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar clase..."
                            value={searchQuery}
                            onChange={handleSearch}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            onFocus={() => searchQuery.length > 2 && setShowResults(true)}
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => setSearchQuery('')}>
                                <X size={16} />
                            </button>
                        )}
                        <button className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" onClick={() => setMobileSearchOpen(false)}>
                            <span className="text-sm">Cancelar</span>
                        </button>

                        {showResults && searchResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {searchResults.map(res => (
                                    <div key={res.id} className="search-result-item" onClick={() => handleResultClick(res.id)}>
                                        <div>
                                            <span className="result-title">{res.topic || res.objetivo_clase || 'Sin título'}</span>
                                            <span className="result-meta">{res.asignatura || 'General'} • {res.curso || ''}</span>
                                        </div>
                                        <ArrowRight className="text-[var(--primary)]" size={16} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {showResults && searchResults.length === 0 && searchQuery.length > 2 && (
                            <div className="search-results-dropdown p-4 text-center text-[var(--muted)]">
                                No se encontraron clases.
                            </div>
                        )}
                    </div>

                    <div className="header-actions">
                        <CreditsBadge />
                        <ReferralButton />
                        <NotificationBell />
                        <button className="header-btn" onClick={() => document.body.classList.toggle('light-mode')} title="Cambiar Tema">
                            <Moon size={20} />
                        </button>
                        <div className="user-profile">
                            <div className="text-right hidden md:block mr-3">
                                <div className="text-sm font-semibold text-[var(--on-background)] leading-tight">
                                    {fullName || 'Usuario'}
                                </div>
                                <div className="text-[11px] text-[var(--muted)] font-medium">
                                    {planName}
                                </div>
                            </div>
                            <div className="avatar">
                                {(fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`content-wrapper ${pathname.includes('/crm') || pathname.includes('/admin') ? 'p-0' : 'p-6'}`}>
                    {children}
                </div>
            </main>

            <Modal isOpen={welcomeModalOpen} onClose={() => handleEbookAction('NO')} title="¡Bienvenido a EducMark!">
                <div className="text-center p-4">
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                        Gracias por unirte. Como regalo de bienvenida, descarga el ebook <strong>De 12 Horas a 5 Minutos</strong> — la guia honesta para que uses EducMark y recuperes tus tardes.
                    </p>
                    <div className="inline-block hover:scale-105 transition-transform duration-300">
                        <Button
                            variant="primary"
                            className="!px-8 !py-4 text-lg"
                            onClick={() => handleEbookAction('SI')}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={18} /> Descargando...
                                </span>
                            ) : (
                                "Descargar Ebook"
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">Cargando...</div>}>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </Suspense>
    );
}
