export type AuthState = "loading" | "authed" | "guest";

export type PtPreset = "member_1v1" | "non_member_1v1" | "member_1v2" | "non_member_1v2";

export type PricingCategory =
  | "membership"
  | "group_class"
  | "personal_training"
  | "assessment"
  | "cycle_plan"
  | "stored_value";

export type MembershipMeta = {
  note?: string;
};

export type StoredValueMeta = {
  gift_membership?: string;
  gift_amount?: number;
  gift_total_value?: number;
};

export type CyclePlanMeta = {
  min_sessions?: number;
  sessions_per_week?: string;
  weeks?: number;
};

export type AssessmentMeta = Record<string, never>;

export type PricingItemBase = {
  id: string;
  name_zh: string;
  name_en?: string;
  price?: number;
};

export type MembershipItem = PricingItemBase & {
  category: "membership";
  session_mode?: "single" | "weekly_pass" | "monthly_pass";
  member_type?: "member" | "non_member";
  meta?: MembershipMeta;
};

export type GroupClassItem = PricingItemBase & {
  category: "group_class";
  session_mode?: "single" | "weekly_pass" | "monthly_pass";
  member_type?: "member" | "non_member";
  meta?: Record<string, unknown>;
};

export type PersonalTrainingItem = PricingItemBase & {
  category: "personal_training";
  session_mode?: "1v1" | "1v2";
  member_type?: "member" | "non_member";
  meta?: Record<string, unknown>;
};

export type AssessmentItem = PricingItemBase & {
  category: "assessment";
  member_type?: "member" | "non_member";
  meta?: AssessmentMeta;
};

export type CyclePlanItem = PricingItemBase & {
  category: "cycle_plan";
  meta?: CyclePlanMeta;
};

export type StoredValueItem = PricingItemBase & {
  category: "stored_value";
  meta?: StoredValueMeta;
};

export type PricingItem =
  | MembershipItem
  | GroupClassItem
  | PersonalTrainingItem
  | AssessmentItem
  | CyclePlanItem
  | StoredValueItem;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type CompareRow = {
  key: string;
  itemIds: string[];
  nameZh: string;
  nameEn?: string;
  mode?: string;
  modeKey?: string;
  memberPrice?: number;
  nonMemberPrice?: number;
  generalPrice?: number;
};

export type PtRow = {
  key: string;
  itemIds: string[];
  nameZh: string;
  nameEn?: string;
  focusZh?: string;
  focusEn?: string;
  idealForZh?: string;
  idealForEn?: string;
  member1v1?: number;
  member1v2?: number;
  nonMember1v1?: number;
  nonMember1v2?: number;
};

export type CycleCourseSelection = {
  program: PtRow;
  preset: PtPreset;
  unitPrice: number;
  qty: number;
};

export type CyclePlanRow = {
  key: string;
  program: string;
  programZh: string;
  programEn?: string;
  weeklySessions: string;
  wpdFollowups: string;
  assessmentsReports: string;
  minSessions: string;
  membershipGift: string;
  membershipGiftZh: string;
  membershipGiftEn: string;
  extraBenefits: string;
  extraBenefitsZh: string;
  extraBenefitsEn: string;
  unitPrice: number;
};
