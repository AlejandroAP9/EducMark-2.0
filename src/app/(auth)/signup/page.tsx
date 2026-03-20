import { Suspense } from 'react';
import { AuthForm } from '@/features/auth/components/AuthForm';

export default function SignupPage() {
    return (
        <Suspense>
            <AuthForm initialMode="register" />
        </Suspense>
    );
}
