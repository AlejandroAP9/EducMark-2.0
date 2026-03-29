'use client';

import { useState, useEffect } from 'react';
import { usePushSubscription } from '../hooks/usePushSubscription';

interface PushNotificationPromptProps {
  userId?: string;
  autoShowDelay?: number;
}

export function PushNotificationPrompt({
  userId,
  autoShowDelay = 3000,
}: PushNotificationPromptProps) {
  const { isSupported, permission, isSubscribed, subscribe } =
    usePushSubscription(userId);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isSupported || isSubscribed || permission === 'denied') return;

    const dismissed = localStorage.getItem('push-prompt-dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), autoShowDelay);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission, autoShowDelay]);

  if (!show) return null;

  const handleEnable = async () => {
    localStorage.setItem('push-prompt-dismissed', 'true');
    await subscribe();
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', 'true');
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-white/10 bg-[#0f0f1a] p-4 shadow-lg space-y-3">
      <p className="text-sm font-medium text-[#F8F9FA]">Activar notificaciones?</p>
      <p className="text-xs text-[#F8F9FA]/60">
        Recibe avisos importantes incluso cuando no tengas la app abierta.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          className="px-3 py-1.5 text-xs rounded-md text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)' }}
        >
          Activar
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-[#F8F9FA]/40 hover:text-[#F8F9FA]/80"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
