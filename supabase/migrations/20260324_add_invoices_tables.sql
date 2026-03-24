-- Add invoices and invoice_items tables for persistent invoice storage

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
