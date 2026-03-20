'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import '../styles/admin.css';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.replace('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (profile?.role === 'admin') {
                    setAuthorized(true);
                } else {
                    router.replace('/dashboard');
                }
            } catch {
                router.replace('/dashboard');
            } finally {
                setChecking(false);
            }
        };

        checkAdmin();
    }, [router, supabase]);

    if (checking) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[var(--muted)]">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="admin-content" style={{ padding: 0 }}>
            {children}
        </div>
    );
}
