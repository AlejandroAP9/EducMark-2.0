import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { type PlanType, PLAN_NAMES, PLAN_LIMITS } from '@/shared/constants/plans';

function normalizePlan(raw: string | null | undefined): PlanType {
    const val = (raw || '').toLowerCase().trim();
    if (val.includes('condor') || val.includes('cóndor')) return 'condor';
    if (val.includes('araucaria')) return 'araucaria';
    if (val.includes('copihue')) return 'copihue';
    return 'free';
}

interface SubscriptionState {
    plan: PlanType;
    planName: string;
    isLoading: boolean;
    isAdmin: boolean;
    role: string;
    fullName: string;
    credits: { remaining: number; total: number; used: number };
    classesLimit: number;
    imagesLimit: number;
    totalGenerations: number;
    hasPermission: (requiredPlan: PlanType) => boolean;
    fetchSubscription: () => Promise<void>;
    _unsubscribe: (() => void) | null;
    initAuthListener: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    plan: 'free',
    planName: 'Plan Gratuito',
    isLoading: true,
    isAdmin: false,
    role: 'profesor',
    fullName: '',
    credits: { remaining: 0, total: 0, used: 0 },
    classesLimit: 3,
    imagesLimit: 27,
    totalGenerations: 0,
    _unsubscribe: null,

    hasPermission: (requiredPlan: PlanType) => {
        const levels: Record<PlanType, number> = {
            free: 0, copihue: 1, araucaria: 2, condor: 3,
        };
        return levels[get().plan] >= levels[requiredPlan];
    },

    fetchSubscription: async () => {
        const supabase = createClient();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                set({ isLoading: false });
                return;
            }

            const { data: stats, error } = await supabase
                .from('user_stats')
                .select('full_name, role, plan_type, classes_limit, remaining_credits, total_credits, total_generations, classes_used_this_month')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (error) console.error('[Subscription] Query error:', error);

            const isAdmin = stats?.role === 'admin';
            const role = stats?.role || 'profesor';
            const fullName = stats?.full_name || session.user.user_metadata?.full_name || '';

            const plan = isAdmin ? 'condor' : normalizePlan(stats?.plan_type);
            const limits = PLAN_LIMITS[plan];

            const classesLimit = stats?.classes_limit ?? limits.classes;
            const used = stats?.classes_used_this_month ?? 0;
            const remaining = Math.max(0, classesLimit - used);

            set({
                plan,
                planName: PLAN_NAMES[plan],
                isLoading: false,
                isAdmin,
                role,
                fullName,
                credits: { remaining, total: classesLimit, used },
                classesLimit,
                imagesLimit: classesLimit * 9,
                totalGenerations: stats?.total_generations ?? 0,
            });

            // Usage warning notifications
            if (!isAdmin && classesLimit > 0 && used > 0) {
                const usagePercent = (used / classesLimit) * 100;
                const { toast } = await import('sonner');
                if (usagePercent >= 100) {
                    toast.error(`Has usado todas tus ${classesLimit} clases este mes. Mejora tu plan para seguir creando.`, { duration: 10000, id: 'usage-limit' });
                } else if (usagePercent >= 80) {
                    toast.warning(`Te quedan ${remaining} clases este mes. Considera mejorar tu plan.`, { duration: 8000, id: 'usage-warning' });
                }
            }
        } catch (error) {
            console.error('[Subscription] Error:', error);
            set({ isLoading: false });
        }
    },

    initAuthListener: () => {
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            get().fetchSubscription();
        });
        set({ _unsubscribe: () => subscription.unsubscribe() });
        // Initial fetch
        get().fetchSubscription();
    },
}));
