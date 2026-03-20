'use client';

/**
 * Notification Bell — PL-25
 * In-app notification system with Supabase Realtime.
 * Uses Realtime channel for instant updates, with initial fetch on mount.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'approval' | 'alert' | 'info';
    read: boolean;
    created_at: string;
    link?: string;
}

export const NotificationBell: React.FC = () => {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showPanel, setShowPanel] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const userIdRef = useRef<string | null>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            userIdRef.current = session.user.id;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            setNotifications(data || []);
        } catch {
            // Silently fail - notifications are non-critical
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Supabase Realtime subscription
    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        const setupRealtime = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const userId = session.user.id;

            channel = supabase
                .channel(`notifications:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification;
                        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        const updated = payload.new as Notification;
                        setNotifications(prev =>
                            prev.map(n => n.id === updated.id ? updated : n)
                        );
                    }
                )
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setShowPanel(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
            >
                <Bell size={20} className="text-[var(--muted)]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                        <span className="font-semibold text-sm text-[var(--on-background)]">Notificaciones</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-[var(--primary)] hover:underline">
                                Marcar todas le&#237;das
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-[var(--muted)] text-sm">Sin notificaciones</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer ${!n.read ? 'bg-[var(--primary)]/5' : ''}`}
                                    onClick={() => {
                                        markAsRead(n.id);
                                        if (n.link) window.location.href = n.link;
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!n.read ? 'font-semibold text-[var(--on-background)]' : 'text-[var(--muted)]'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{n.message}</p>
                                        </div>
                                        <span className="text-[10px] text-[var(--muted)] flex-shrink-0">{timeAgo(n.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
