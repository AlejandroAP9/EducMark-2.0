'use client';

import React from 'react';
import {
    LayoutDashboard,
    Presentation,
    Library,
    UserCircle,
    CreditCard,
    BarChart3,
    LogOut,
    Users,
    Layers,
    LifeBuoy,
    ClipboardCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const { isAdmin, role: userRole } = useSubscriptionStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const navItems = [
        { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { id: 'generator', icon: Presentation, label: 'Generar Clase', path: '/dashboard/generator' },
        { id: 'assessments', icon: Layers, label: 'Evaluaciones', path: '/summative' },
        { id: 'history', icon: Library, label: 'Biblioteca', path: '/dashboard/history' },
        { id: 'profile', icon: UserCircle, label: 'Mi Perfil', path: '/dashboard/profile' },
        { id: 'subscription', icon: CreditCard, label: 'Suscripción', path: '/dashboard/subscription' },
        { id: 'portfolio', icon: ClipboardCheck, label: 'Portafolio', path: '/dashboard/portfolio' },
        { id: 'help', icon: LifeBuoy, label: 'Ayuda', path: '/dashboard/help' },
        { id: 'utp', icon: BarChart3, label: 'Panel UTP', path: '/dashboard/utp', role: 'utp' },
        { id: 'director', icon: BarChart3, label: 'Panel Director', path: '/dashboard/director', role: 'director' },
        { id: 'crm', icon: Users, label: 'CRM', path: '/dashboard/crm', isAdmin: true },
        { id: 'admin', icon: BarChart3, label: 'Admin', path: '/dashboard/admin', isAdmin: true },
    ];

    // Filter nav items based on admin status and roles
    const visibleNavItems = navItems.filter(item => {
        if (item.isAdmin) return isAdmin;
        if (item.role === 'utp') return userRole === 'utp' || userRole === 'director' || isAdmin;
        if (item.role === 'director') return userRole === 'director' || isAdmin;
        return true;
    });

    return (
        <>
            <div
                className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            ></div>

            <aside className={`sidebar ${mobileOpen ? 'active' : ''}`} id="sidebar">
                <div className="sidebar-header">
                    <a href="/" className="logo">
                        <img src="/images/logo.png" alt="EducMark" width="32" height="32" className="w-8 h-8 rounded-full bg-white p-0.5" /> EducMark
                    </a>
                </div>

                <nav className="sidebar-nav flex flex-col">
                    {visibleNavItems.map((item) => (
                        <Link key={item.id}
                            href={item.path}
                            className={`nav-item ${pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)) ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="mt-4">
                        <button className="nav-item danger w-full text-left" onClick={handleLogout}>
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    );
}
