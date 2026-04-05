'use client';

import { useRouter } from 'next/navigation';
import { AdminHealthScore } from '@/features/admin/components/AdminHealthScore';

export default function HealthScorePage() {
    const router = useRouter();
    return <AdminHealthScore onBack={() => router.push('/dashboard/admin')} />;
}
