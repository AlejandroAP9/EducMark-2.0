import { Suspense } from 'react';
import { AuthForm } from '@/features/auth/components/AuthForm';

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <AuthForm initialMode="reset" />
        </Suspense>
    );
}
