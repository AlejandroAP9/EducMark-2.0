'use client';
import { useRouter } from 'next/navigation';
import { StudentManagement } from '@/features/dashboard/components/StudentManagement';
export default function StudentsPage() { const router = useRouter(); return <StudentManagement onBack={() => router.push('/dashboard')} />; }
