import { createClient } from "@supabase/supabase-js";

import type { PricingItem } from "./mockData";



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



export const supabase =

  supabaseUrl && supabaseAnonKey

    ? createClient(supabaseUrl, supabaseAnonKey)

    : null;



export type PricingRule = {

  id: string;

  rule_code: string;

  trigger_type: "recharge" | "buy_sessions" | "renew" | "upgrade" | "generic";

  trigger_json: Record<string, unknown>;

  result_json: Record<string, unknown>;

  priority: number;

  is_active: boolean;

};



export type PricingBenefit = {

  id: string;

  item_id: string;

  benefit_type: string;

  description: string;

  value_json: Record<string, unknown>;

  sort_order: number;

};



export async function fetchPricingItems(): Promise<PricingItem[]> {

  if (!supabase) {

    return [];

  }



  const { data, error } = await supabase

    .from("pricing_items")

    .select("id, category, name_zh, name_en, member_type, session_mode, price, meta")

    .eq("is_active", true)

    .order("sort_order", { ascending: true });



  if (error) {

    throw new Error(error.message);

  }



  return (data ?? []) as PricingItem[];

}



export async function fetchPricingRules(): Promise<PricingRule[]> {

  if (!supabase) return [];



  const { data, error } = await supabase

    .from("pricing_rules")

    .select("id, rule_code, trigger_type, trigger_json, result_json, priority, is_active")

    .eq("is_active", true)

    .order("priority", { ascending: true });



  if (error) throw new Error(error.message);



  return (data ?? []) as PricingRule[];

}



export async function fetchPricingBenefits(): Promise<PricingBenefit[]> {

  if (!supabase) return [];



  const { data, error } = await supabase

    .from("pricing_benefits")

    .select("id, item_id, benefit_type, description, value_json, sort_order")

    .order("sort_order", { ascending: true });



  if (error) throw new Error(error.message);



  return (data ?? []) as PricingBenefit[];

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

