-- Project database structure for Oxygen Sales Pricing
-- Consolidated database schema + seed data + RLS policies.
-- Safe to run in a fresh Supabase project.

create extension if not exists pgcrypto;

-- =====================================================
-- Helper function: admin check based on profiles.role
-- Safe to create before profiles table exists.
-- =====================================================
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if to_regclass('public.profiles') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
end;
$$;

-- =====================================================
-- 1) Core catalog tables
-- =====================================================
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name_zh text not null,
  name_en text,
  meta jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_items_category on catalog_items (category);
create index if not exists idx_catalog_items_active on catalog_items (is_active);

create table if not exists catalog_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references catalog_items(id) on delete cascade,
  member_type text,
  session_mode text,
  price numeric(12,2) not null default 0,
  currency text not null default 'CAD',
  meta jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_variants_item on catalog_variants (item_id);
create index if not exists idx_catalog_variants_active on catalog_variants (is_active);

-- =====================================================
-- 2) Cart/session tables
-- =====================================================
create table if not exists cart_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_name text,
  customer_phone text unique,
  status text not null default 'active',
  credit_input numeric(12,2) not null default 0,
  currency text not null default 'CAD',
  tax_rate numeric(5,4) not null default 0.13,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cart_sessions_user on cart_sessions (user_id);
create index if not exists idx_cart_sessions_status on cart_sessions (status);
create index if not exists idx_cart_sessions_name on cart_sessions (customer_name);
create index if not exists idx_cart_sessions_phone on cart_sessions (customer_phone);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references cart_sessions(id) on delete cascade,
  item_id uuid not null references catalog_items(id),
  variant_id uuid references catalog_variants(id),
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  currency text not null default 'CAD',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cart_items_cart on cart_items (cart_id);

-- =====================================================
-- 3) Customer/profile tables
-- =====================================================
create table if not exists customer_profiles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  name text not null,
  email text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_profiles_email on customer_profiles (email);
create index if not exists idx_customer_profiles_created_by on customer_profiles (created_by);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'sales',
  phone text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on profiles (user_id);
create index if not exists idx_profiles_role on profiles (role);
create index if not exists idx_profiles_status on profiles (status);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, role, status, metadata)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'sales'),
    'active',
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.set_created_by_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.set_user_id_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

drop trigger if exists trg_customer_profiles_created_by on public.customer_profiles;
create trigger trg_customer_profiles_created_by
before insert on public.customer_profiles
for each row execute procedure public.set_created_by_from_auth();

drop trigger if exists trg_cart_sessions_user_id on public.cart_sessions;
create trigger trg_cart_sessions_user_id
before insert on public.cart_sessions
for each row execute procedure public.set_user_id_from_auth();

-- =====================================================
-- 4) Invoice tables
-- =====================================================
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  issue_date date not null,
  customer_name text not null,
  customer_email text not null,
  customer_address text not null,
  payment_method text not null,
  status text not null default 'saved',
  subtotal numeric(12,2) not null default 0,
  taxable_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'CAD',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_status_check check (status in ('draft', 'saved', 'sent'))
);

create index if not exists idx_invoices_issue_date on invoices (issue_date desc);
create index if not exists idx_invoices_status on invoices (status);
create index if not exists idx_invoices_customer_name on invoices (customer_name);
create index if not exists idx_invoices_created_at on invoices (created_at desc);
create index if not exists idx_invoices_created_by on invoices (created_by);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  line_no int not null,
  item_name text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  source_category text,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_items_quantity_check check (quantity > 0),
  constraint invoice_items_price_check check (unit_price >= 0),
  constraint invoice_items_discount_check check (discount >= 0),
  constraint invoice_items_line_total_check check (line_total >= 0),
  constraint invoice_items_invoice_line_unique unique (invoice_id, line_no)
);

create index if not exists idx_invoice_items_invoice_id on invoice_items (invoice_id);
create index if not exists idx_invoice_items_source_category on invoice_items (source_category);

-- =====================================================
-- 5) Invoice template settings
-- =====================================================
create table if not exists invoice_template_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '默认模板',
  settings_json jsonb not null default '{}'::jsonb,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_invoice_template_settings_user_default
  on invoice_template_settings (user_id)
  where is_default = true;

create index if not exists idx_invoice_template_settings_user_id
  on invoice_template_settings (user_id);

-- =====================================================
-- 6) Seed data
-- =====================================================
with inserted_items as (
  insert into catalog_items (category, name_zh, name_en, meta, is_active)
  values
    ('membership','日卡','Day Pass','{"billing_cycle":"day"}',true),
    ('membership','周卡','Week Pass','{"billing_cycle":"week"}',true),
    ('membership','月卡','Monthly Membership','{"billing_cycle":"month"}',true),
    ('membership','年卡','Annual Membership','{"note":"年卡每个月支付99","note_en":"Annual membership billed at 99 per month","billing_cycle":"month","plan_length_months":12}',true),
    ('membership','激活费','Activation Fee','{"one_time":true}',true),
    ('group_class','单次课程','Single Class','{}',true),
    ('group_class','单周通行','Weekly Pass','{}',true),
    ('group_class','月度通行','Monthly Pass','{}',true),
    ('stored_value','储值卡3000','Stored Value 3000','{"gift_amount":300,"gift_membership":"1个月","gift_membership_en":"1-Month Membership","gift_total_value":595}',true),
    ('stored_value','储值卡6000','Stored Value 6000','{"gift_amount":600,"gift_membership":"6个月","gift_membership_en":"6-Month Membership","gift_total_value":1314}',true),
    ('stored_value','储值卡9000','Stored Value 9000','{"gift_amount":1500,"gift_membership":"1年","gift_membership_en":"1-Year Membership","gift_total_value":3161}',true),
    ('cycle_plan','6周计划','6-Week Program','{"weeks":6,"min_sessions":12,"sessions_per_week":"2-4"}',true),
    ('cycle_plan','12周计划','12-Week Program','{"weeks":12,"min_sessions":24,"sessions_per_week":"2-4"}',true),
    ('cycle_plan','24周计划','24-Week Program','{"weeks":24,"min_sessions":48,"sessions_per_week":"2-4"}',true),
    ('assessment','饮食评估和饮食计划设计','Personal Nutrition Assessment and Planning','{"focus":"饮食评估与饮食计划设计","focus_en":"Personal nutrition assessment and planning"}',true),
    ('assessment','专业身体评估与周期计划','Professional Personal Wellness Consulation & Wellness Program provideed by our Wellness program Director','{"focus":"专业身体评估与周期计划制定","focus_en":"Professional wellness consultation and phased plan"}',true),
    ('personal_training','基础力量训练','Foundational Fitness','{"focus":"建立力量与稳定性","focus_en":"Build strength, stability, and movement foundation","target":"新手","target_en":"Beginners / Long-term inactive clients"}',true),
    ('personal_training','体型重塑','Body Recomposition','{"focus":"减脂塑形","focus_en":"Fat loss with muscle maintenance and body shaping","target":"想瘦/增肌","target_en":"Weight loss / Body shaping goals"}',true),
    ('personal_training','拳击体能','Boxing Conditioning','{"focus":"提升心肺","focus_en":"Improve cardio and release stress","target":"高压力","target_en":"High stress / Boxing lovers"}',true),
    ('personal_training','体态矫正','Posture Correction','{"focus":"改善姿态","focus_en":"Correct muscle imbalance and posture alignment","target":"圆肩等","target_en":"Rounded shoulders / Pelvic issues"}',true),
    ('personal_training','功能训练','Functional Training','{"focus":"提升灵活性","focus_en":"Improve daily movement quality and mobility","target":"久坐","target_en":"Sedentary / Limited mobility"}',true),
    ('personal_training','疼痛管理','Pain Management','{"focus":"缓解疼痛","focus_en":"Reduce chronic pain and prevent injury","target":"慢性不适","target_en":"Shoulder / Back / Knee pain"}',true),
    ('personal_training','孕期产后','Pre/Post Natal','{"focus":"安全恢复","focus_en":"Safe training for pregnancy and recovery","target":"孕期产后","target_en":"Pregnancy / Postpartum clients"}',true)
  returning id, category, name_zh
)
insert into catalog_variants (item_id, member_type, session_mode, price, currency, meta, is_active)
select id, null, 'single', 35, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='日卡'
union all select id, null, 'weekly_pass', 99, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='周卡'
union all select id, null, 'monthly_pass', 175, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='月卡'
union all select id, null, 'annual_pass', 99, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='年卡'
union all select id, null, null, 120, 'CAD', '{}'::jsonb, true from inserted_items where category='membership' and name_zh='激活费'
union all select id, 'member', 'single', 20, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单次课程'
union all select id, 'non_member', 'single', 35, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单次课程'
union all select id, 'member', 'weekly_pass', 99, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单周通行'
union all select id, 'non_member', 'weekly_pass', 150, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='单周通行'
union all select id, 'member', 'monthly_pass', 250, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='月度通行'
union all select id, 'non_member', 'monthly_pass', 400, 'CAD', '{}'::jsonb, true from inserted_items where category='group_class' and name_zh='月度通行'
union all select id, null, null, 3000, 'CAD', '{}'::jsonb, true from inserted_items where category='stored_value' and name_zh='储值卡3000'
union all select id, null, null, 6000, 'CAD', '{}'::jsonb, true from inserted_items where category='stored_value' and name_zh='储值卡6000'
union all select id, null, null, 9000, 'CAD', '{}'::jsonb, true from inserted_items where category='stored_value' and name_zh='储值卡9000'
union all select id, null, null, 0, 'CAD', '{}'::jsonb, true from inserted_items where category='cycle_plan' and name_zh in ('6周计划','12周计划','24周计划')
union all select id, null, null, 120, 'CAD', '{}'::jsonb, true from inserted_items where category='assessment' and name_zh='饮食评估和饮食计划设计'
union all select id, null, null, 120, 'CAD', '{}'::jsonb, true from inserted_items where category='assessment' and name_zh='专业身体评估与周期计划'
union all select id, 'member', '1v1', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all select id, 'member', '1v2', 70, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all select id, 'non_member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all select id, 'non_member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='基础力量训练'
union all select id, 'member', '1v1', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all select id, 'member', '1v2', 70, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all select id, 'non_member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all select id, 'non_member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体型重塑'
union all select id, 'member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all select id, 'member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all select id, 'non_member', '1v1', 130, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all select id, 'non_member', '1v2', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='拳击体能'
union all select id, 'member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all select id, 'member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all select id, 'non_member', '1v1', 130, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all select id, 'non_member', '1v2', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='体态矫正'
union all select id, 'member', '1v1', 115, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all select id, 'member', '1v2', 85, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all select id, 'non_member', '1v1', 130, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all select id, 'non_member', '1v2', 100, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='功能训练'
union all select id, 'member', '1v1', 135, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all select id, 'member', '1v2', 95, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all select id, 'non_member', '1v1', 150, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all select id, 'non_member', '1v2', 110, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='疼痛管理'
union all select id, 'member', '1v1', 135, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后'
union all select id, 'member', '1v2', 95, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后'
union all select id, 'non_member', '1v1', 150, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后'
union all select id, 'non_member', '1v2', 110, 'CAD', '{}'::jsonb, true from inserted_items where category='personal_training' and name_zh='孕期产后';

-- =====================================================
-- 7) RLS policies
-- =====================================================

-- -----------------------------------------------------
-- catalog_items / catalog_variants
-- Anonymous: no access
-- Logged-in users: read only
-- Admin: full access
-- -----------------------------------------------------
alter table public.catalog_items enable row level security;
alter table public.catalog_variants enable row level security;

drop policy if exists "Logged in users can view catalog items" on public.catalog_items;
drop policy if exists "Admins can insert catalog items" on public.catalog_items;
drop policy if exists "Admins can update catalog items" on public.catalog_items;
drop policy if exists "Admins can delete catalog items" on public.catalog_items;

create policy "Logged in users can view catalog items"
on public.catalog_items
for select
using (auth.uid() is not null or public.is_admin());

create policy "Admins can insert catalog items"
on public.catalog_items
for insert
with check (public.is_admin());

create policy "Admins can update catalog items"
on public.catalog_items
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete catalog items"
on public.catalog_items
for delete
using (public.is_admin());

drop policy if exists "Logged in users can view catalog variants" on public.catalog_variants;
drop policy if exists "Admins can insert catalog variants" on public.catalog_variants;
drop policy if exists "Admins can update catalog variants" on public.catalog_variants;
drop policy if exists "Admins can delete catalog variants" on public.catalog_variants;

create policy "Logged in users can view catalog variants"
on public.catalog_variants
for select
using (auth.uid() is not null or public.is_admin());

create policy "Admins can insert catalog variants"
on public.catalog_variants
for insert
with check (public.is_admin());

create policy "Admins can update catalog variants"
on public.catalog_variants
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete catalog variants"
on public.catalog_variants
for delete
using (public.is_admin());

-- -----------------------------------------------------
-- profiles
-- Normal users: view/update own profile
-- Admin: full access
-- -----------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = user_id or public.is_admin());

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "Admins can insert profiles"
on public.profiles
for insert
with check (public.is_admin());

create policy "Admins can delete profiles"
on public.profiles
for delete
using (public.is_admin());

-- -----------------------------------------------------
-- invoices
-- Logged-in users: create, view own, update own
-- Admin: full access
-- -----------------------------------------------------
alter table public.invoices enable row level security;

drop policy if exists "Users can view own invoices" on public.invoices;
drop policy if exists "Users can create invoices" on public.invoices;
drop policy if exists "Users can update own invoices" on public.invoices;
drop policy if exists "Users can delete own invoices" on public.invoices;

create policy "Users can view own invoices"
on public.invoices
for select
using (auth.uid() = created_by or public.is_admin());

create policy "Users can create invoices"
on public.invoices
for insert
with check (auth.uid() = created_by or public.is_admin());

create policy "Users can update own invoices"
on public.invoices
for update
using (auth.uid() = created_by or public.is_admin())
with check (auth.uid() = created_by or public.is_admin());

create policy "Users can delete own invoices"
on public.invoices
for delete
using (auth.uid() = created_by or public.is_admin());

-- -----------------------------------------------------
-- invoice_items
-- Ownership derived from invoices.created_by
-- -----------------------------------------------------
alter table public.invoice_items enable row level security;

drop policy if exists "Users can view own invoice items" on public.invoice_items;
drop policy if exists "Users can create invoice items for own invoices" on public.invoice_items;
drop policy if exists "Users can update own invoice items" on public.invoice_items;
drop policy if exists "Users can delete own invoice items" on public.invoice_items;

create policy "Users can view own invoice items"
on public.invoice_items
for select
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.created_by = auth.uid()
  )
  or public.is_admin()
);

create policy "Users can create invoice items for own invoices"
on public.invoice_items
for insert
with check (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.created_by = auth.uid()
  )
  or public.is_admin()
);

create policy "Users can update own invoice items"
on public.invoice_items
for update
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.created_by = auth.uid()
  )
  or public.is_admin()
)
with check (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.created_by = auth.uid()
  )
  or public.is_admin()
);

create policy "Users can delete own invoice items"
on public.invoice_items
for delete
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.created_by = auth.uid()
  )
  or public.is_admin()
);

-- -----------------------------------------------------
-- customer_profiles
-- Logged-in users: create/view/update own customer profiles
-- Admin: full access
-- -----------------------------------------------------
alter table public.customer_profiles enable row level security;

drop policy if exists "Users can view own customer profiles" on public.customer_profiles;
drop policy if exists "Users can create customer profiles" on public.customer_profiles;
drop policy if exists "Users can update own customer profiles" on public.customer_profiles;
drop policy if exists "Users can delete own customer profiles" on public.customer_profiles;

create policy "Users can view own customer profiles"
on public.customer_profiles
for select
using (auth.uid() = created_by or public.is_admin());

create policy "Users can create customer profiles"
on public.customer_profiles
for insert
with check (auth.uid() = created_by or public.is_admin());

create policy "Users can update own customer profiles"
on public.customer_profiles
for update
using (auth.uid() = created_by or public.is_admin())
with check (auth.uid() = created_by or public.is_admin());

create policy "Users can delete own customer profiles"
on public.customer_profiles
for delete
using (auth.uid() = created_by or public.is_admin());

-- -----------------------------------------------------
-- cart_sessions
-- Logged-in users: full control over own sessions
-- Admin: full access
-- -----------------------------------------------------
alter table public.cart_sessions enable row level security;

drop policy if exists "Users can view own cart sessions" on public.cart_sessions;
drop policy if exists "Users can create own cart sessions" on public.cart_sessions;
drop policy if exists "Users can update own cart sessions" on public.cart_sessions;
drop policy if exists "Users can delete own cart sessions" on public.cart_sessions;

create policy "Users can view own cart sessions"
on public.cart_sessions
for select
using (auth.uid() = user_id or public.is_admin());

create policy "Users can create own cart sessions"
on public.cart_sessions
for insert
with check (auth.uid() = user_id or public.is_admin());

create policy "Users can update own cart sessions"
on public.cart_sessions
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own cart sessions"
on public.cart_sessions
for delete
using (auth.uid() = user_id or public.is_admin());

-- -----------------------------------------------------
-- cart_items
-- Ownership derived from cart_sessions.user_id
-- -----------------------------------------------------
alter table public.cart_items enable row level security;

drop policy if exists "Users can view own cart items" on public.cart_items;
drop policy if exists "Users can create own cart items" on public.cart_items;
drop policy if exists "Users can update own cart items" on public.cart_items;
drop policy if exists "Users can delete own cart items" on public.cart_items;

create policy "Users can view own cart items"
on public.cart_items
for select
using (
  exists (
    select 1
    from public.cart_sessions cs
    where cs.id = cart_items.cart_id
      and cs.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "Users can create own cart items"
on public.cart_items
for insert
with check (
  exists (
    select 1
    from public.cart_sessions cs
    where cs.id = cart_items.cart_id
      and cs.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "Users can update own cart items"
on public.cart_items
for update
using (
  exists (
    select 1
    from public.cart_sessions cs
    where cs.id = cart_items.cart_id
      and cs.user_id = auth.uid()
  )
  or public.is_admin()
)
with check (
  exists (
    select 1
    from public.cart_sessions cs
    where cs.id = cart_items.cart_id
      and cs.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy "Users can delete own cart items"
on public.cart_items
for delete
using (
  exists (
    select 1
    from public.cart_sessions cs
    where cs.id = cart_items.cart_id
      and cs.user_id = auth.uid()
  )
  or public.is_admin()
);

-- -----------------------------------------------------
-- invoice_template_settings
-- Admin only
-- -----------------------------------------------------
alter table public.invoice_template_settings enable row level security;

drop policy if exists "Admins can view invoice template settings" on public.invoice_template_settings;
drop policy if exists "Admins can create invoice template settings" on public.invoice_template_settings;
drop policy if exists "Admins can update invoice template settings" on public.invoice_template_settings;
drop policy if exists "Admins can delete invoice template settings" on public.invoice_template_settings;

create policy "Admins can view invoice template settings"
on public.invoice_template_settings
for select
using (public.is_admin());

create policy "Admins can create invoice template settings"
on public.invoice_template_settings
for insert
with check (public.is_admin());

create policy "Admins can update invoice template settings"
on public.invoice_template_settings
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete invoice template settings"
on public.invoice_template_settings
for delete
using (public.is_admin());
