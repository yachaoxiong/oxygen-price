-- Add invoice template settings table for per-user template persistence

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

alter table invoice_template_settings enable row level security;

drop policy if exists "invoice_template_settings_select_own" on invoice_template_settings;
create policy "invoice_template_settings_select_own"
  on invoice_template_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "invoice_template_settings_insert_admin_only" on invoice_template_settings;
create policy "invoice_template_settings_insert_admin_only"
  on invoice_template_settings
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "invoice_template_settings_update_admin_only" on invoice_template_settings;
create policy "invoice_template_settings_update_admin_only"
  on invoice_template_settings
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "invoice_template_settings_delete_admin_only" on invoice_template_settings;
create policy "invoice_template_settings_delete_admin_only"
  on invoice_template_settings
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );
