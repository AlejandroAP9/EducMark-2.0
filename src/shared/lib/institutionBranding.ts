import { createClient } from '@/lib/supabase/client';

export interface InstitutionBranding {
  logo: string | null;
  institutionName: string | null;
  primaryColor: string | null;
}

const EMPTY_BRANDING: InstitutionBranding = {
  logo: null,
  institutionName: null,
  primaryColor: null,
};

/**
 * Fetch institution branding for the current user.
 * Resolution cascade:
 * 1. institution_settings (if user belongs to a configured institution)
 * 2. user_profiles (individual logo/name)
 * 3. null (no branding — documents export as before)
 */
export async function fetchInstitutionBranding(): Promise<InstitutionBranding> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return EMPTY_BRANDING;

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('institution, institution_logo_url, institution_display_name')
    .eq('user_id', userId)
    .single();

  if (!profile) return EMPTY_BRANDING;

  // Try institution_settings first (if user has institution)
  if (profile.institution) {
    const { data: settings } = await supabase
      .from('institution_settings')
      .select('branding_logo_url, branding_primary_color, institution')
      .eq('institution', profile.institution)
      .single();

    if (settings?.branding_logo_url) {
      return {
        logo: settings.branding_logo_url,
        institutionName: settings.institution || profile.institution_display_name || profile.institution,
        primaryColor: settings.branding_primary_color || null,
      };
    }
  }

  // Fallback to user_profiles individual branding
  if (profile.institution_logo_url) {
    return {
      logo: profile.institution_logo_url,
      institutionName: profile.institution_display_name || profile.institution || null,
      primaryColor: null,
    };
  }

  // No branding configured — return institution name at least
  return {
    logo: null,
    institutionName: profile.institution_display_name || profile.institution || null,
    primaryColor: null,
  };
}
