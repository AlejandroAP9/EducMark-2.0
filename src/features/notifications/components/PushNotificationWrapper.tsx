'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PushNotificationPrompt } from './PushNotificationPrompt';

export function PushNotificationWrapper() {
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setUserId(session.user.id);
    });
  }, []);

  if (!userId) return null;

  return <PushNotificationPrompt userId={userId} />;
}
