'use client';

import { useState, useEffect } from 'react';
import { fetchInstitutionBranding, type InstitutionBranding } from '@/shared/lib/institutionBranding';

export function useInstitutionBranding() {
  const [branding, setBranding] = useState<InstitutionBranding>({
    logo: null,
    institutionName: null,
    primaryColor: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchInstitutionBranding().then((result) => {
      if (!cancelled) {
        setBranding(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { ...branding, loading };
}
