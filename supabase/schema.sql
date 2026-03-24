-- 1) 核心商品/课程表（只存 items 本体）
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

-- 2) 价格/规格变体（会员/非会员/1v1/1v2 等）
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

-- 3) 购物车会话（含信用抵扣 + 税率）
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

-- 4) 购物车条目
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

-- 5) 客户档案
create table if not exists customer_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_profiles_email on customer_profiles (email);

-- 6) 发票主表
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

-- 7) 发票项目明细表
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
