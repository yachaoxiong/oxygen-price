import { createClient } from "@supabase/supabase-js";

import type { PricingItem } from "@/types/pricing";

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  address: string;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceStatus = "draft" | "saved" | "sent";

export type InvoiceItemRecord = {
  id: string;
  invoice_id: string;
  line_no: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  source_category: string | null;
  line_total: number;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceRecord = {
  id: string;
  invoice_no: string;
  issue_date: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  payment_method: string;
  status: InvoiceStatus;
  subtotal: number;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  items?: InvoiceItemRecord[];
};

export type CreateInvoiceInput = {
  invoice_no: string;
  issue_date: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  payment_method: string;
  status?: InvoiceStatus;
  subtotal: number;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  currency?: string;
  created_by?: string | null;
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    source_category?: string | null;
    line_total: number;
  }>;
};

export type InvoiceTemplateSettingsRecord = {
  id: string;
  user_id: string;
  name: string;
  settings_json: Record<string, unknown>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



export const supabase =

  supabaseUrl && supabaseAnonKey

    ? createClient(supabaseUrl, supabaseAnonKey)

    : null;






export async function fetchPricingItems(): Promise<PricingItem[]> {

  if (!supabase) {

    return [];

  }



  const [{ data: items, error: itemsError }, { data: variants, error: variantsError }] = await Promise.all([
    supabase
      .from("catalog_items")
      .select("id, category, name_zh, name_en, meta, is_active")
      .eq("is_active", true),
    supabase
      .from("catalog_variants")
      .select("id, item_id, member_type, session_mode, price, meta, is_active")
      .eq("is_active", true),
  ]);

  if (itemsError) {

    throw new Error(itemsError.message);

  }

  if (variantsError) {

    throw new Error(variantsError.message);

  }

  const parsedItems = (items ?? []).map((item) => ({
    ...item,
    meta: typeof item.meta === "string" ? JSON.parse(item.meta) : item.meta,
  }));

  const parsedVariants = (variants ?? []).map((variant) => ({
    ...variant,
    meta: typeof variant.meta === "string" ? JSON.parse(variant.meta) : variant.meta,
  }));

  const itemMap = new Map(parsedItems.map((item) => [item.id, item]));
  const pricingItems: PricingItem[] = [];

  parsedVariants.forEach((variant) => {
    const item = itemMap.get(variant.item_id);
    if (!item) return;

    pricingItems.push({
      id: `${item.id}:${variant.id}`,
      category: item.category,
      name_zh: item.name_zh,
      name_en: item.name_en,
      member_type: variant.member_type ?? undefined,
      session_mode: variant.session_mode ?? undefined,
      price: variant.price ?? undefined,
      meta: item.meta,
    } as PricingItem);
  });

  if (pricingItems.length === 0) {
    return parsedItems as PricingItem[];
  }

  return pricingItems;

}






export async function fetchCustomerProfiles(): Promise<CustomerProfile[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("customer_profiles")
    .select("id, name, email, address, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerProfile[];
}

export async function createCustomerProfile(input: Omit<CustomerProfile, "id" | "created_at" | "updated_at">): Promise<CustomerProfile> {
  if (!supabase) throw new Error("Supabase 未配置");

  const { data, error } = await supabase
    .from("customer_profiles")
    .insert({
      name: input.name,
      email: input.email,
      address: input.address,
    })
    .select("id, name, email, address, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as CustomerProfile;
}

export async function updateCustomerProfile(
  id: string,
  input: Omit<CustomerProfile, "id" | "created_at" | "updated_at">,
): Promise<CustomerProfile> {
  if (!supabase) throw new Error("Supabase 未配置");

  const { data, error } = await supabase
    .from("customer_profiles")
    .update({
      name: input.name,
      email: input.email,
      address: input.address,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, name, email, address, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as CustomerProfile;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
  if (!supabase) throw new Error("Supabase 未配置");

  const status = input.status ?? "saved";
  const currency = input.currency ?? "CAD";

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      invoice_no: input.invoice_no,
      issue_date: input.issue_date,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_address: input.customer_address,
      payment_method: input.payment_method,
      status,
      subtotal: input.subtotal,
      taxable_amount: input.taxable_amount,
      tax_amount: input.tax_amount,
      total_amount: input.total_amount,
      currency,
      created_by: input.created_by ?? null,
    })
    .select("id, invoice_no, issue_date, customer_name, customer_email, customer_address, payment_method, status, subtotal, taxable_amount, tax_amount, total_amount, currency, created_by, created_at, updated_at")
    .single();

  if (invoiceError) throw new Error(invoiceError.message);

  const lines = input.items.map((item, index) => ({
    invoice_id: invoice.id,
    line_no: index + 1,
    item_name: item.item_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    source_category: item.source_category ?? null,
    line_total: item.line_total,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("invoice_items")
    .insert(lines)
    .select("id, invoice_id, line_no, item_name, quantity, unit_price, discount, source_category, line_total, created_at, updated_at")
    .order("line_no", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    ...(invoice as InvoiceRecord),
    items: (insertedItems ?? []) as InvoiceItemRecord[],
  };
}

export async function fetchInvoices(): Promise<InvoiceRecord[]> {
  if (!supabase) return [];

  const { data: invoicesData, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, invoice_no, issue_date, customer_name, customer_email, customer_address, payment_method, status, subtotal, taxable_amount, tax_amount, total_amount, currency, created_by, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (invoicesError) throw new Error(invoicesError.message);

  const invoices = (invoicesData ?? []) as InvoiceRecord[];
  if (invoices.length === 0) return [];

  const invoiceIds = invoices.map((row) => row.id);

  const { data: itemsData, error: itemsError } = await supabase
    .from("invoice_items")
    .select("id, invoice_id, line_no, item_name, quantity, unit_price, discount, source_category, line_total, created_at, updated_at")
    .in("invoice_id", invoiceIds)
    .order("line_no", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  const itemsByInvoiceId = (itemsData ?? []).reduce<Record<string, InvoiceItemRecord[]>>((acc, item) => {
    const key = item.invoice_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item as InvoiceItemRecord);
    return acc;
  }, {});

  return invoices.map((row) => ({
    ...row,
    items: (itemsByInvoiceId[row.id] ?? []).slice().sort((a, b) => a.line_no - b.line_no),
  }));
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void> {
  if (!supabase) throw new Error("Supabase 未配置");

  const { error } = await supabase
    .from("invoices")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) throw new Error(error.message);
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未配置");

  const { data: existing, error: findError } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!existing) throw new Error("发票不存在或已被删除");

  const { error: deleteError } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (deleteError) throw new Error(deleteError.message);
}

export async function fetchInvoiceTemplateSettings(): Promise<InvoiceTemplateSettingsRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("invoice_template_settings")
    .select("id, user_id, name, settings_json, is_default, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceTemplateSettingsRecord[];
}

export async function saveDefaultInvoiceTemplateSettings(settingsJson: Record<string, unknown>): Promise<InvoiceTemplateSettingsRecord> {
  if (!supabase) throw new Error("Supabase 未配置");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("请先登录后再保存模板设置");

  const { data: existing, error: findError } = await supabase
    .from("invoice_template_settings")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("invoice_template_settings")
      .update({
        settings_json: settingsJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, user_id, name, settings_json, is_default, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);
    return data as InvoiceTemplateSettingsRecord;
  }

  const { data, error } = await supabase
    .from("invoice_template_settings")
    .insert({
      user_id: user.id,
      name: "默认模板",
      settings_json: settingsJson,
      is_default: true,
    })
    .select("id, user_id, name, settings_json, is_default, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as InvoiceTemplateSettingsRecord;
}

export async function getCurrentUser() {

  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();

  return data.user ?? null;

}

export type UserProfile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  phone: string | null;
  status: string | null;
  metadata: Record<string, unknown>;
};

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, email, full_name, role, phone, status, metadata")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}



export async function signInWithPassword(email: string, password: string) {

  if (!supabase) throw new Error("Supabase 未配置");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);

}



export async function signOut() {

  if (!supabase) return;

  await supabase.auth.signOut();

}



export async function insertQueryLog(params: {

  userId: string;

  queryText: string;

  intent: string;

  input: Record<string, unknown>;

  output: Record<string, unknown>;

}) {

  if (!supabase) return;



  const { error } = await supabase.from("pricing_query_logs").insert({

    user_id: params.userId,

    query_text: params.queryText,

    intent: params.intent,

    input_json: params.input,

    output_json: params.output,

  });



  if (error) throw new Error(error.message);

}

