export type PricingItem = {
  id: string;
  category: "membership" | "group_class" | "personal_training" | "assessment" | "cycle_plan" | "stored_value";
  name_zh: string;
  name_en?: string;
  member_type?: "member" | "non_member";
  session_mode?: "1v1" | "1v2" | "single" | "weekly_pass" | "monthly_pass";
  price?: number;
  meta?: Record<string, unknown>;
};

export const mockPricing: PricingItem[] = [
  { id: "m1", category: "membership", name_zh: "日卡", session_mode: "single", price: 35 },
  { id: "m2", category: "membership", name_zh: "周卡", session_mode: "weekly_pass", price: 99 },
  { id: "m3", category: "membership", name_zh: "月卡", session_mode: "monthly_pass", price: 175 },
  { id: "m4", category: "membership", name_zh: "年卡（按月付）", session_mode: "monthly_pass", price: 99, meta: { note: "年卡每个月支付99" } },
  { id: "g1", category: "group_class", name_zh: "单次课程", member_type: "member", session_mode: "single", price: 20 },
  { id: "g2", category: "group_class", name_zh: "单次课程", member_type: "non_member", session_mode: "single", price: 35 },
  { id: "s1", category: "stored_value", name_zh: "储值卡3000", price: 3000, meta: { gift_membership: "1个月", gift_amount: 300, gift_total_value: 595 } },
  { id: "s2", category: "stored_value", name_zh: "储值卡6000", price: 6000, meta: { gift_membership: "6个月", gift_amount: 600, gift_total_value: 1314 } },
  { id: "s3", category: "stored_value", name_zh: "储值卡9000", price: 9000, meta: { gift_membership: "1年", gift_amount: 1500, gift_total_value: 3161 } },
  { id: "c1", category: "cycle_plan", name_zh: "6周计划", meta: { min_sessions: 12, sessions_per_week: "2-4" } },
  { id: "c2", category: "cycle_plan", name_zh: "12周计划", meta: { min_sessions: 24, sessions_per_week: "2-4" } },
  { id: "c3", category: "cycle_plan", name_zh: "24周计划", meta: { min_sessions: 48, sessions_per_week: "2-4" } },
];
