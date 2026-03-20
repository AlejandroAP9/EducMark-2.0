'use client';

import { useEffect, useState } from 'react';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);
  const initAuthListener = useSubscriptionStore(s => s.initAuthListener);

  useEffect(() => {
    initAuthListener();
    setMounted(true);
  }, [initAuthListener]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
