-- ============================================================================
-- EducMark — Base Schema Export
-- Generated from Supabase public schema on 2026-04-04
--
-- This migration creates all 38 tables in the public schema with their
-- columns, types, defaults, constraints, primary keys, foreign keys,
-- and Row Level Security enabled status.
--
-- NOTE: RLS policies are NOT included — only the ENABLE statement.
-- NOTE: auth.users is managed by Supabase Auth and is NOT created here.
-- ============================================================================

-- ==========================================================================
-- STANDALONE TABLES (no public FK dependencies)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- subscription_plans
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  plan_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  price_clp INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  mercadopago_plan_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_plans_plan_type_key UNIQUE (plan_type)
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.subscription_plans IS 'Configuracion centralizada de planes de suscripcion';

-- --------------------------------------------------------------------------
-- user_profiles
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  avatar_url TEXT,
  institution TEXT,
  subjects TEXT[],
  role TEXT,
  is_active BOOLEAN DEFAULT true,
  referral_code TEXT,
  referred_by TEXT,

  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_email_key UNIQUE (email),
  CONSTRAINT user_profiles_referral_code_key UNIQUE (referral_code),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- user_subscriptions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID UNIQUE,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active'::text NOT NULL,
  classes_limit INTEGER DEFAULT 3 NOT NULL,
  mercadopago_subscription_id TEXT,
  mercadopago_preapproval_id TEXT,
  next_billing_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_class_generated_at UUID,
  classes_used_this_month NUMERIC DEFAULT '0'::numeric,
  subscription_type TEXT DEFAULT 'free'::text,
  remaining_credits INTEGER DEFAULT 5,
  total_generations INTEGER DEFAULT 0,
  last_generation_at TIMESTAMPTZ,
  total_credits INTEGER DEFAULT 5,
  telefono TEXT,

  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- trial_classes
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_classes (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  course TEXT NOT NULL,
  objective TEXT NOT NULL,
  duration INTEGER DEFAULT 45,
  special_needs TEXT,
  context TEXT,
  content JSONB,
  content_html TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT trial_classes_pkey PRIMARY KEY (id)
);
ALTER TABLE public.trial_classes ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- payment_transactions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID,
  plan_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CLP'::text,
  status TEXT NOT NULL,
  transaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- monthly_usage
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  classes_generated INTEGER DEFAULT 0,
  plan_type TEXT NOT NULL,
  plan_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT monthly_usage_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- leads
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  source TEXT DEFAULT 'landing_form'::text,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  form_data JSONB,
  status TEXT DEFAULT 'new'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT leads_pkey PRIMARY KEY (id)
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- generation_logs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  execution_id TEXT NOT NULL,
  user_name TEXT,
  subject TEXT,
  course TEXT,
  objective TEXT,
  user_plan TEXT DEFAULT 'trial'::text,
  user_usage INTEGER DEFAULT 0,
  user_limit INTEGER DEFAULT 3,
  html_size INTEGER,
  slides_generated INTEGER,
  generation_start TIMESTAMPTZ DEFAULT now(),
  generation_end TIMESTAMPTZ,
  total_time_seconds NUMERIC,
  status TEXT DEFAULT 'started'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  plan_info JSONB,
  request_data JSONB,
  "timestamp" TIMESTAMPTZ,
  user_id UUID,
  user_email TEXT,

  CONSTRAINT generation_logs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- audit_logs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT extensions.uuid_generate_v4() NOT NULL,
  event TEXT NOT NULL,
  payment_id TEXT,
  user_id UUID,
  plan_type TEXT,
  status TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'CLP'::text,
  payer_email TEXT,
  details JSONB,
  "timestamp" TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- n8n_chat_historial_bot
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.n8n_chat_historial_bot (
  id INTEGER GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  session_id CHARACTER VARYING NOT NULL,
  message JSONB NOT NULL,
  "Conversacion" TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT n8n_chat_historial_bot_pkey PRIMARY KEY (id)
);
ALTER TABLE public.n8n_chat_historial_bot ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- user_referrals
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID DEFAULT extensions.uuid_generate_v4() NOT NULL,
  referrer_id UUID,
  referred_id UUID,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),

  CONSTRAINT user_referrals_pkey PRIMARY KEY (id),
  CONSTRAINT user_referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users (id),
  CONSTRAINT user_referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users (id)
);
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- usuarios_crm  (must come before interactions, crm_tasks, lead_stage_history)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios_crm (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID UNIQUE,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  rol TEXT,
  plan TEXT,
  estatus_suscripcion TEXT,
  creditos_restantes INTEGER,
  institucion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  descarga_ebook TEXT,
  source TEXT DEFAULT 'organic'::text,
  stage TEXT DEFAULT 'lead_frio'::text,
  last_interaction TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  priority TEXT DEFAULT 'media'::text,
  assigned_to UUID,
  instagram TEXT,
  last_contacted_at TIMESTAMPTZ,
  total_revenue INTEGER DEFAULT 0,

  CONSTRAINT usuarios_crm_pkey PRIMARY KEY (id)
);
ALTER TABLE public.usuarios_crm ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- beta_applications
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beta_applications (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  level TEXT NOT NULL,
  institution TEXT NOT NULL,
  city TEXT NOT NULL,
  years_experience TEXT NOT NULL,
  ai_usage TEXT NOT NULL,
  main_challenge TEXT NOT NULL,
  commitment_7days BOOLEAN DEFAULT false,
  commitment_feedback BOOLEAN DEFAULT false,
  commitment_honest BOOLEAN DEFAULT false,
  video_willingness TEXT NOT NULL,
  expectations TEXT,
  referral_source TEXT,
  challenge_score INTEGER,
  total_score INTEGER,
  status TEXT DEFAULT 'pending'::text,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  user_id UUID,
  recommendation TEXT,
  category TEXT,
  submitted_at TIMESTAMPTZ,

  CONSTRAINT beta_applications_pkey PRIMARY KEY (id),
  CONSTRAINT beta_applications_email_key UNIQUE (email),
  CONSTRAINT beta_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.beta_applications IS 'Postulaciones al programa de beta testers de EducMark';

-- --------------------------------------------------------------------------
-- beta_feedback
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  email TEXT NOT NULL,
  nps_score INTEGER,
  top_feature TEXT,
  worst_feature TEXT,
  pricing_model TEXT,
  bugs_reported TEXT,
  feature_request TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false,

  CONSTRAINT beta_feedback_pkey PRIMARY KEY (id)
);
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- usage_logs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID,
  model TEXT NOT NULL,
  function_name TEXT DEFAULT 'generate-class-kit'::text,
  tokens_input INTEGER DEFAULT 0 NOT NULL,
  tokens_output INTEGER DEFAULT 0 NOT NULL,
  tokens_total INTEGER DEFAULT (tokens_input + tokens_output),
  cost_usd NUMERIC DEFAULT 0,
  was_cached BOOLEAN DEFAULT false,
  cache_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  response_time_ms INTEGER,

  CONSTRAINT usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.usage_logs IS 'Tracks AI API usage per user for cost management and analytics';

-- --------------------------------------------------------------------------
-- ai_cache
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  prompt_hash TEXT NOT NULL,
  params JSONB NOT NULL,
  response JSONB NOT NULL,
  model TEXT DEFAULT 'gemini-2.0-flash'::text,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT ai_cache_pkey PRIMARY KEY (id)
);
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- model_costs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.model_costs (
  model TEXT NOT NULL,
  input_cost_per_m NUMERIC NOT NULL,
  output_cost_per_m NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT model_costs_pkey PRIMARY KEY (model)
);
ALTER TABLE public.model_costs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- pipeline_stages
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1'::text,
  "position" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id),
  CONSTRAINT pipeline_stages_name_key UNIQUE (name)
);
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- crm_events_outbox
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_events_outbox (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT crm_events_outbox_pkey PRIMARY KEY (id)
);
ALTER TABLE public.crm_events_outbox ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- omr_results
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.omr_results (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  evaluation_id TEXT NOT NULL,
  student_name TEXT,
  answers JSONB NOT NULL,
  score JSONB NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT omr_results_pkey PRIMARY KEY (id)
);
ALTER TABLE public.omr_results ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- students
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  rut TEXT,
  first_name TEXT,
  last_name TEXT,
  course_grade TEXT,
  email TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_rut_key UNIQUE (rut),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- item_bank
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.item_bank (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  oa TEXT NOT NULL,
  cognitive_skill TEXT NOT NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  rubric TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  approval_status TEXT DEFAULT 'approved'::text,
  image_url TEXT,

  CONSTRAINT item_bank_pkey PRIMARY KEY (id),
  CONSTRAINT item_bank_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.item_bank ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- institution_settings
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_settings (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  institution TEXT NOT NULL,
  managed_by UUID,
  license_status TEXT DEFAULT 'active'::text NOT NULL,
  license_expires_at TIMESTAMPTZ,
  branding_logo_url TEXT,
  branding_primary_color TEXT DEFAULT '#a48fff'::text,
  academic_period TEXT DEFAULT 'Semestre 1'::text,
  grading_scale JSONB DEFAULT '{"max": 7.0, "min": 1.0, "pass": 4.0}'::jsonb NOT NULL,
  help_email TEXT,
  help_whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  alert_threshold INTEGER DEFAULT 50,
  grade_scale_min NUMERIC DEFAULT 1.0,
  grade_scale_max NUMERIC DEFAULT 7.0,
  grade_scale_passing NUMERIC DEFAULT 4.0,
  grade_scale_percentage INTEGER DEFAULT 60,

  CONSTRAINT institution_settings_pkey PRIMARY KEY (id),
  CONSTRAINT institution_settings_institution_key UNIQUE (institution),
  CONSTRAINT institution_settings_managed_by_fkey FOREIGN KEY (managed_by) REFERENCES auth.users (id)
);
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- support_tickets
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  institution TEXT,
  user_id UUID NOT NULL,
  user_email TEXT,
  category TEXT DEFAULT 'general'::text NOT NULL,
  priority TEXT DEFAULT 'media'::text NOT NULL,
  status TEXT DEFAULT 'open'::text NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,

  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- notifications
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT ''::text NOT NULL,
  type TEXT DEFAULT 'info'::text NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- referral_events
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'registered'::text NOT NULL,
  credits_given_referrer INTEGER DEFAULT 0,
  credits_given_referred INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  rewarded_at TIMESTAMPTZ,

  CONSTRAINT referral_events_pkey PRIMARY KEY (id),
  CONSTRAINT referral_events_referred_id_key UNIQUE (referred_id),
  CONSTRAINT referral_events_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users (id),
  CONSTRAINT referral_events_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users (id)
);
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- daily_metrics
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  active_users_today INTEGER DEFAULT 0,
  users_free INTEGER DEFAULT 0,
  users_paid INTEGER DEFAULT 0,
  churn_today INTEGER DEFAULT 0,
  classes_generated_today INTEGER DEFAULT 0,
  classes_generated_total INTEGER DEFAULT 0,
  evaluations_created_today INTEGER DEFAULT 0,
  evaluations_created_total INTEGER DEFAULT 0,
  items_created_today INTEGER DEFAULT 0,
  avg_classes_per_active_user NUMERIC DEFAULT 0,
  revenue_today INTEGER DEFAULT 0,
  revenue_month INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  new_subscriptions_today INTEGER DEFAULT 0,
  cancelled_subscriptions_today INTEGER DEFAULT 0,
  arpu INTEGER DEFAULT 0,
  new_leads_today INTEGER DEFAULT 0,
  leads_total INTEGER DEFAULT 0,
  interactions_today INTEGER DEFAULT 0,
  leads_by_stage JSONB DEFAULT '{}'::jsonb,
  conversion_rate NUMERIC DEFAULT 0,
  avg_time_to_convert NUMERIC DEFAULT 0,
  top_subject TEXT DEFAULT ''::text,
  top_grade TEXT DEFAULT ''::text,
  subjects_distribution JSONB DEFAULT '{}'::jsonb,
  grades_distribution JSONB DEFAULT '{}'::jsonb,
  avg_rating NUMERIC DEFAULT 0,
  credits_consumed_today INTEGER DEFAULT 0,
  snapshot_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT daily_metrics_pkey PRIMARY KEY (date)
);
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.daily_metrics IS 'EducMark Business OS: Snapshot diario de 30 KPIs. Se llena con capture_daily_metrics().';

-- --------------------------------------------------------------------------
-- push_subscriptions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- TABLES WITH PUBLIC FK DEPENDENCIES (ordered by dependency depth)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- generated_classes  (referenced by planning_versions, planning_approvals)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generated_classes (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  email TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  curso TEXT NOT NULL,
  objetivo_clase TEXT,
  duracion_clase TEXT DEFAULT '90 minutos'::text NOT NULL,
  link_presentacion TEXT NOT NULL,
  status TEXT DEFAULT 'completed'::text NOT NULL,
  execution_id TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  topic TEXT,
  feedback TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  planificacion TEXT,
  quiz TEXT,
  cache_key TEXT,
  rating SMALLINT,
  planning_status TEXT DEFAULT 'draft'::text NOT NULL,
  approval_status TEXT DEFAULT 'pending'::text NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  current_version INTEGER DEFAULT 1 NOT NULL,
  planning_blocks JSONB DEFAULT '{}'::jsonb NOT NULL,
  exit_ticket JSONB DEFAULT '{}'::jsonb NOT NULL,
  link_paci TEXT,
  attached_resources JSONB DEFAULT '[]'::jsonb,

  CONSTRAINT generated_classes_pkey PRIMARY KEY (id),
  CONSTRAINT generated_classes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
  CONSTRAINT generated_classes_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users (id)
);
ALTER TABLE public.generated_classes ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- evaluations  (referenced by evaluation_blueprint, evaluation_items, evaluation_stimuli)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID,
  title TEXT NOT NULL,
  grade TEXT,
  subject TEXT,
  unit TEXT,
  file_url TEXT,
  answer_key_url TEXT,
  status TEXT DEFAULT 'active'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  annulled_questions INTEGER[] DEFAULT '{}'::integer[],
  answer_sheet_url TEXT,

  CONSTRAINT evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- interactions  (FK -> usuarios_crm)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  direction TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.usuarios_crm (id)
);
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- crm_tasks  (FK -> usuarios_crm)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'media'::text,
  status TEXT DEFAULT 'pendiente'::text,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT crm_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT crm_tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.usuarios_crm (id)
);
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- lead_stage_history  (FK -> usuarios_crm)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID,
  from_stage TEXT,
  to_stage TEXT,
  changed_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT lead_stage_history_pkey PRIMARY KEY (id),
  CONSTRAINT lead_stage_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.usuarios_crm (id)
);
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- planning_versions  (FK -> generated_classes, auth.users)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planning_versions (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  generated_class_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  edited_by UUID NOT NULL,
  change_summary TEXT,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT planning_versions_pkey PRIMARY KEY (id),
  CONSTRAINT planning_versions_generated_class_id_fkey FOREIGN KEY (generated_class_id) REFERENCES public.generated_classes (id),
  CONSTRAINT planning_versions_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES auth.users (id)
);
ALTER TABLE public.planning_versions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- planning_approvals  (FK -> generated_classes, auth.users)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planning_approvals (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  generated_class_id UUID NOT NULL,
  submitted_by UUID NOT NULL,
  reviewer_id UUID,
  status TEXT DEFAULT 'pending'::text NOT NULL,
  reviewer_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT planning_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT planning_approvals_generated_class_id_fkey FOREIGN KEY (generated_class_id) REFERENCES public.generated_classes (id),
  CONSTRAINT planning_approvals_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users (id),
  CONSTRAINT planning_approvals_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users (id)
);
ALTER TABLE public.planning_approvals ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- evaluation_blueprint  (FK -> evaluations)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluation_blueprint (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  evaluation_id UUID,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL,
  oa TEXT NOT NULL,
  topic TEXT,
  skill TEXT,
  correct_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT evaluation_blueprint_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_blueprint_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.evaluations (id)
);
ALTER TABLE public.evaluation_blueprint ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- evaluation_stimuli  (FK -> evaluations, auth.users)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluation_stimuli (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  evaluation_id UUID,
  user_id UUID,
  title TEXT DEFAULT ''::text NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT evaluation_stimuli_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_stimuli_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.evaluations (id),
  CONSTRAINT evaluation_stimuli_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);
ALTER TABLE public.evaluation_stimuli ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- evaluation_items  (FK -> evaluations, evaluation_stimuli)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluation_items (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  evaluation_id UUID,
  type TEXT NOT NULL,
  oa TEXT,
  topic TEXT,
  skill TEXT,
  difficulty TEXT,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  stimulus_id UUID,
  image_url TEXT,

  CONSTRAINT evaluation_items_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_items_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.evaluations (id),
  CONSTRAINT evaluation_items_stimulus_id_fkey FOREIGN KEY (stimulus_id) REFERENCES public.evaluation_stimuli (id)
);
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
