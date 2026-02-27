-- OXYGEN Sales Pricing - Supabase Schema
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin helper from existing auth table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
CREATE POLICY "Users can check own admin status" ON public.admin_users
  FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Unified pricing catalog
CREATE TABLE IF NOT EXISTS public.pricing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN (
    'membership',
    'group_class',
    'personal_training',
    'assessment',
    'cycle_plan',
    'stored_value'
  )),
  name_zh TEXT NOT NULL,
  name_en TEXT,
  member_type TEXT CHECK (member_type IN ('member', 'non_member')),
  session_mode TEXT CHECK (session_mode IN ('1v1', '1v2', 'single', 'weekly_pass', 'monthly_pass')),
  price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'CNY',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.pricing_items(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN (
    'membership_gift',
    'duration_extension',
    'credit_transfer',
    'included_service',
    'referral_reward',
    'waiver',
    'cash_bonus',
    'first_month_bundle'
  )),
  description TEXT NOT NULL,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_code TEXT NOT NULL UNIQUE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('recharge', 'buy_sessions', 'renew', 'upgrade', 'generic')),
  trigger_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_faq_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intent TEXT NOT NULL,
  question_pattern TEXT NOT NULL,
  answer_template TEXT NOT NULL,
  variables_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_query_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  intent TEXT,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_faq_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_query_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read pricing items" ON public.pricing_items;
CREATE POLICY "Authenticated can read pricing items" ON public.pricing_items
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage pricing items" ON public.pricing_items;
CREATE POLICY "Admins can manage pricing items" ON public.pricing_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can read pricing benefits" ON public.pricing_benefits;
CREATE POLICY "Authenticated can read pricing benefits" ON public.pricing_benefits
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage pricing benefits" ON public.pricing_benefits;
CREATE POLICY "Admins can manage pricing benefits" ON public.pricing_benefits
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can read pricing rules" ON public.pricing_rules;
CREATE POLICY "Authenticated can read pricing rules" ON public.pricing_rules
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON public.pricing_rules;
CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can read faq templates" ON public.pricing_faq_templates;
CREATE POLICY "Authenticated can read faq templates" ON public.pricing_faq_templates
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage faq templates" ON public.pricing_faq_templates;
CREATE POLICY "Admins can manage faq templates" ON public.pricing_faq_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can read own query logs" ON public.pricing_query_logs;
CREATE POLICY "Users can read own query logs" ON public.pricing_query_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Authenticated can insert query logs" ON public.pricing_query_logs;
CREATE POLICY "Authenticated can insert query logs" ON public.pricing_query_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (auth.uid() = user_id OR user_id IS NULL));

CREATE INDEX IF NOT EXISTS idx_pricing_items_category ON public.pricing_items(category);
CREATE INDEX IF NOT EXISTS idx_pricing_items_member_type ON public.pricing_items(member_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_trigger_type ON public.pricing_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_pricing_logs_user_created ON public.pricing_query_logs(user_id, created_at DESC);
