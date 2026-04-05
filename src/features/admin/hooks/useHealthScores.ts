'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface HealthScoreUser {
    user_id: string;
    full_name: string;
    email: string;
    score: number;
    classes_7d: number;
    evaluations_7d: number;
    omr_scans_7d: number;
    logins_7d: number;
    days_inactive: number;
    calculated_at: string;
    plan_type: string | null;
}

interface UseHealthScoresReturn {
    users: HealthScoreUser[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useHealthScores(): UseHealthScoresReturn {
    const supabase = createClient();
    const [users, setUsers] = useState<HealthScoreUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealthScores = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Get the latest calculated_at timestamp
            const { data: latestRow, error: latestError } = await supabase
                .from('user_health_scores')
                .select('calculated_at')
                .order('calculated_at', { ascending: false })
                .limit(1)
                .single();

            if (latestError) {
                // Table might not exist yet or be empty
                if (latestError.code === 'PGRST116') {
                    setUsers([]);
                    return;
                }
                throw latestError;
            }

            if (!latestRow) {
                setUsers([]);
                return;
            }

            // Fetch all scores for the latest calculation
            const { data: scores, error: scoresError } = await supabase
                .from('user_health_scores')
                .select('*')
                .eq('calculated_at', latestRow.calculated_at)
                .order('score', { ascending: true });

            if (scoresError) throw scoresError;

            if (!scores || scores.length === 0) {
                setUsers([]);
                return;
            }

            // Get user profiles for name/email
            const userIds = scores.map(s => s.user_id).filter(Boolean);

            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('user_id, full_name, email')
                .in('user_id', userIds);

            if (profilesError) throw profilesError;

            // Get subscriptions for plan_type
            const { data: subs, error: subsError } = await supabase
                .from('user_subscriptions')
                .select('user_id, plan_type')
                .in('user_id', userIds);

            if (subsError) throw subsError;

            const profileMap = new Map(
                (profiles || []).map(p => [p.user_id, p])
            );
            const subMap = new Map(
                (subs || []).map(s => [s.user_id, s])
            );

            const merged: HealthScoreUser[] = scores.map(s => {
                const profile = profileMap.get(s.user_id);
                const sub = subMap.get(s.user_id);
                return {
                    user_id: s.user_id,
                    full_name: profile?.full_name || 'Sin nombre',
                    email: profile?.email || 'Sin email',
                    score: s.score ?? 0,
                    classes_7d: s.classes_7d ?? 0,
                    evaluations_7d: s.evaluations_7d ?? 0,
                    omr_scans_7d: s.omr_scans_7d ?? 0,
                    logins_7d: s.logins_7d ?? 0,
                    days_inactive: s.days_inactive ?? 0,
                    calculated_at: s.calculated_at,
                    plan_type: sub?.plan_type || null,
                };
            });

            setUsers(merged);
        } catch (err) {
            console.error('Error fetching health scores:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar health scores');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealthScores();
    }, [fetchHealthScores]);

    return { users, loading, error, refetch: fetchHealthScores };
}
