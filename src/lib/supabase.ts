import { createClient } from "@supabase/supabase-js";

import type { PricingItem } from "@/types/pricing";



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






export async function getCurrentUser() {

  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();

  return data.user ?? null;

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

