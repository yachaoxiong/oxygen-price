"use client";
/* cSpell:words supabase fullpay */

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Dumbbell,
  Shield,
  Target,
  Flame,
  HeartPulse,
  Baby,
  Apple,
  UserCheck,
  User,
  Users,
  X,
  CupSoda,
  UtensilsCrossed,
  CalendarDays,
  CalendarRange,
  Gift,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  fetchPricingBenefits,
  fetchPricingItems,
  fetchPricingRules,
  getCurrentUser,
  insertQueryLog,
  signInWithPassword,
  signOut,
  type PricingBenefit,
  type PricingRule,
} from "@/lib/supabase";
import { mockPricing, type PricingItem } from "@/lib/mockData";

type Tab = "pricing" | "calculator" | "qa";
type AuthState = "loading" | "authed" | "guest";
type CategoryFilter = "all" | PricingItem["category"];

type CompareRow = {
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

type PtRow = {
  key: string;
  itemIds: string[];
  nameZh: string;
  nameEn?: string;
  member1v1?: number;
  member1v2?: number;
  nonMember1v1?: number;
  nonMember1v2?: number;
};

function getMembershipRank(nameZh: string) {
  if (/日|day/i.test(nameZh)) return 0;
  if (/周|week/i.test(nameZh)) return 1;
  if (/月|month/i.test(nameZh)) return 2;
  if (/年|year|annual/i.test(nameZh)) return 3;
  return 4;
}

function getCycleRankFromProgram(program: string) {
  const matched = program.match(/(\d+)/);
  if (!matched) return Number.MAX_SAFE_INTEGER;
  return Number(matched[1]);
}

const categoryMeta: Record<PricingItem["category"], { en: string; zh: string }> = {
  membership: { en: "Membership", zh: "会员会籍" },
  group_class: { en: "Group Classes", zh: "团体课程" },
  personal_training: { en: "Personal Training", zh: "私教课程" },
  assessment: { en: "Assessments", zh: "专项评估" },
  cycle_plan: { en: "Program Cycles", zh: "周期计划" },
  stored_value: { en: "Stored Value", zh: "储值计划" },
};

const promotionHighlights = [
  {
    group: "new",
    groupLabel: "新客优惠 / New Client",
    title: "Within 30 days after first trial / 首次体验课后30天内",
    detail: "20% of completed sessions converted to Training Credit for renewal / 上课节数的20%可转为续费抵扣积分",
    trigger: "Policy: TRIAL_30D_20PCT_CREDIT",
  },
  {
    group: "renewal",
    groupLabel: "续费优惠 / Renewal",
    title: "Renew within 30 days after trial / 体验后30天内续课",
    detail: "40% of completed sessions converted to Training Credit / 上课节数的40%可转为续费积分",
    trigger: "Policy: RENEW_30D_40PCT_CREDIT",
  },
  {
    group: "referral",
    groupLabel: "推荐优惠 / Referral",
    title: "Referral Program / 推荐优惠",
    detail: "After referee spends $1,000, both get 1-month membership / 带新客消费满$1,000，双方各赠送1个月会员",
    trigger: "Policy: REFERRAL_BOTH_GET_1MONTH",
  },
  {
    group: "upgrade",
    groupLabel: "升级优惠 / Upgrade",
    title: "Monthly to Annual Upgrade / 月卡升年卡",
    detail: "Paid monthly amount can be used as annual credit / 已付金额可抵扣年卡",
    trigger: "Policy: MONTHLY_TO_ANNUAL_CREDIT",
  },
  {
    group: "upgrade",
    groupLabel: "升级优惠 / Upgrade",
    title: "Annual Prepayment / 年卡一次性付清",
    detail: "Activation fee waived / 免激活费",
    trigger: "Policy: ANNUAL_PREPAY_WAIVE_ACTIVATION",
  },
];

const annualMembershipBenefits = [
  "首月包括一次一对一专属身体评估 / 1 Professional Personal Wellness Consultation by Program Director",
  "一份专属训练计划 / 1 Month Wellness Training Program by Program Director",
  "一次营养评估及饮食计划设计 / 1 Personal Nutrition Assessment and Planning",
  "一次团课体验 / 1 Group Training Session",
];

const personalTrainingProgramInfo: Record<string, { focus: string; idealFor: string; icon: LucideIcon }> = {
  "基础力量训练": {
    focus: "Build strength, stability, and movement foundation / 建立力量、稳定性与动作基础",
    idealFor: "Beginners / Long-term inactive clients / 新手与久未运动人群",
    icon: Dumbbell,
  },
  "体型重塑": {
    focus: "Fat loss with muscle maintenance and body shaping / 减脂塑形并维持肌肉",
    idealFor: "Weight loss / Body shaping goals / 想瘦、改体型、增肌或减脂",
    icon: Flame,
  },
  "拳击体能": {
    focus: "Improve cardio and release stress / 提升心肺功能并释放压力",
    idealFor: "High stress / Boxing lovers / 压力大或喜欢对抗训练人群",
    icon: Target,
  },
  "体态矫正": {
    focus: "Correct muscle imbalance and posture alignment / 改善体态与肌肉失衡",
    idealFor: "Rounded shoulders / Pelvic issues / 圆肩、骨盆问题人群",
    icon: Shield,
  },
  "功能训练": {
    focus: "Improve daily movement quality and mobility / 提升日常动作效率与灵活度",
    idealFor: "Sedentary / Limited mobility / 久坐与活动受限人群",
    icon: Activity,
  },
  "疼痛管理": {
    focus: "Reduce chronic pain and prevent injury / 缓解慢性不适并预防运动损伤",
    idealFor: "Shoulder / Back / Knee pain / 肩腰膝疼痛人群",
    icon: HeartPulse,
  },
  "孕期产后": {
    focus: "Safe training for pregnancy and recovery / 孕期安全训练与产后恢复",
    idealFor: "Pregnancy / Postpartum clients / 怀孕与产后人群",
    icon: Baby,
  },
  "饮食评估和饮食计划设计": {
    focus: "Personal nutrition assessment and planning / 饮食评估与饮食计划设计",
    idealFor: "Diet optimization / Body goal support / 饮食优化与体型目标人群",
    icon: Apple,
  },
  "专业身体评估与周期计划": {
    focus: "Professional wellness consultation and periodized plan / 专业身体评估与周期计划制定",
    idealFor: "New members / Long-term goal clients / 新会员与长期目标客户",
    icon: UserCheck,
  },
};

const rechargePlans = [
  {
    amount: "$3,000",
    amountZh: "冲 3000 储值卡",
    membershipGift: "1-Month Membership",
    membershipGiftZh: "一个月会员",
    bonusCredit: "$300",
    totalValue: "$595",
  },
  {
    amount: "$6,000",
    amountZh: "冲 6000 储值卡",
    membershipGift: "6-Month Membership",
    membershipGiftZh: "6 个月会员",
    bonusCredit: "$600",
    totalValue: "$1,314",
  },
  {
    amount: "$9,000",
    amountZh: "冲 9000 储值卡",
    membershipGift: "1-Year Membership + Gift Package",
    membershipGiftZh: "一年会员+专属礼物套餐",
    bonusCredit: "$1,500",
    totalValue: "$3,161",
  },
];

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatMoney(value?: number) {
  if (typeof value !== "number") return "-";
  return `$${value.toLocaleString()}`;
}

function formatPercent(value?: number) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(0)}%`;
}

function displayMode(mode?: string) {
  if (!mode) return undefined;
  const map: Record<string, string> = {
    single: "Single / 单次",
    weekly_pass: "Weekly / 周通",
    monthly_pass: "Monthly / 月通",
    "1v1": "1v1",
    "1v2": "1v2",
  };
  return map[mode] ?? mode;
}

function getModeSortRank(mode?: string) {
  if (!mode) return 99;
  if (mode === "single") return 0;
  if (mode === "weekly_pass") return 1;
  if (mode === "monthly_pass") return 2;
  return 99;
}

function getGroupClassDays(mode?: string) {
  if (mode === "weekly_pass") return 7;
  if (mode === "monthly_pass") return 30;
  return null;
}

const glass = "rounded-2xl";

const solidButtonBase =
  "rounded-[10px] border border-white/12 px-3 py-1.5 font-medium transition-all duration-200 text-slate-300 bg-[#121824]/90 hover:border-white/25 hover:bg-[#1a2233]/95";

export default function Home() {
  const [tab, setTab] = useState<Tab>("pricing");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [activePromotionGroup, setActivePromotionGroup] = useState("new");
  const [presentationMode, setPresentationMode] = useState(false);
  const [clientDemoMode, setClientDemoMode] = useState(false);
  const [recharge, setRecharge] = useState(6000);
  const [sessions, setSessions] = useState(12);
  const [question, setQuestion] = useState("冲6000有什么权益和福利？");

  const [selectedPtRow, setSelectedPtRow] = useState<PtRow | null>(null);
  const [ptUnitMember1v1, setPtUnitMember1v1] = useState<number>(0);
  const [ptUnitNonMember1v1, setPtUnitNonMember1v1] = useState<number>(0);
  const [ptUnitMember1v2, setPtUnitMember1v2] = useState<number>(0);
  const [ptUnitNonMember1v2, setPtUnitNonMember1v2] = useState<number>(0);
  const [ptQtyMember1v1, setPtQtyMember1v1] = useState<number>(12);
  const [ptQtyNonMember1v1, setPtQtyNonMember1v1] = useState<number>(12);
  const [ptQtyMember1v2, setPtQtyMember1v2] = useState<number>(12);
  const [ptQtyNonMember1v2, setPtQtyNonMember1v2] = useState<number>(12);
  const [ptPreset, setPtPreset] = useState<"member_1v1" | "non_member_1v1" | "member_1v2" | "non_member_1v2">("member_1v1");
  const [ptCredit, setPtCredit] = useState<number>(0);
  const [ptReportOpen, setPtReportOpen] = useState(false);
  const [ptCopySuccess, setPtCopySuccess] = useState(false);
  const [ptUnitInputEmpty, setPtUnitInputEmpty] = useState(false);
  const [ptQtyInputEmpty, setPtQtyInputEmpty] = useState(false);
  const [ptCreditInputEmpty, setPtCreditInputEmpty] = useState(false);

  const [pricingItems, setPricingItems] = useState<PricingItem[]>(mockPricing);
  const [pricingBenefits, setPricingBenefits] = useState<PricingBenefit[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function init() {
      const user = await getCurrentUser();
      if (!mounted) return;
      if (user) {
        setUserId(user.id);
        setAuthState("authed");
      } else {
        setAuthState("guest");
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (authState !== "authed") return;
    let mounted = true;
    async function loadData() {
      try {
        const [items, rules, benefits] = await Promise.all([
          fetchPricingItems(),
          fetchPricingRules(),
          fetchPricingBenefits(),
        ]);
        if (!mounted) return;
        setPricingItems(items.length ? items : mockPricing);
        setPricingRules(rules);
        setPricingBenefits(benefits);
      } catch {
        if (!mounted) return;
        setPricingItems(mockPricing);
        setPricingRules([]);
        setPricingBenefits([]);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [authState]);

  const benefitsByItemId = useMemo(() => {
    const map = new Map<string, string[]>();
    pricingBenefits.forEach((b) => {
      if (!map.has(b.item_id)) map.set(b.item_id, []);
      map.get(b.item_id)!.push(b.description);
    });
    return map;
  }, [pricingBenefits]);

  const promotionGroups = useMemo(() => {
    const groups = new Map<string, { label: string; items: typeof promotionHighlights }>();

    promotionHighlights.forEach((promo) => {
      if (!groups.has(promo.group)) {
        groups.set(promo.group, {
          label: promo.groupLabel,
          items: [],
        });
      }
      groups.get(promo.group)!.items.push(promo);
    });

    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
    }));
  }, []);

  const groupedSections = useMemo(() => {
    const grouped = pricingItems.reduce<Record<PricingItem["category"], PricingItem[]>>(
      (acc, item) => {
        acc[item.category].push(item);
        return acc;
      },
      {
        membership: [],
        group_class: [],
        personal_training: [],
        assessment: [],
        cycle_plan: [],
        stored_value: [],
      },
    );

    const standardSections = (Object.keys(grouped) as PricingItem["category"][])
      .filter((category) => category !== "personal_training" && category !== "stored_value" && category !== "cycle_plan")
      .filter((category) => grouped[category].length > 0)
      .filter((category) => categoryFilter === "all" || category === categoryFilter)
      .map((category) => {
        const rowsMap = new Map<string, CompareRow>();

        grouped[category].forEach((item) => {
          if (category === "membership" && item.name_zh.includes("激活费")) return;

          const rowKey = `${item.name_zh}|${item.session_mode ?? "general"}`;
          if (!rowsMap.has(rowKey)) {
            rowsMap.set(rowKey, {
              key: rowKey,
              itemIds: [item.id],
              nameZh: item.name_zh,
              nameEn: item.name_en,
              mode: displayMode(item.session_mode),
              modeKey: item.session_mode,
            });
          }

          const row = rowsMap.get(rowKey)!;
          if (!row.itemIds.includes(item.id)) row.itemIds.push(item.id);

          if (item.member_type === "member") row.memberPrice = item.price;
          else if (item.member_type === "non_member") row.nonMemberPrice = item.price;
          else row.generalPrice = item.price;
        });

        const sortedRows = Array.from(rowsMap.values()).sort((a, b) => {
          if (category === "membership") {
            const rankDiff = getMembershipRank(a.nameZh) - getMembershipRank(b.nameZh);
            if (rankDiff !== 0) return rankDiff;
          }

          if (category === "group_class") {
            const modeRankDiff = getModeSortRank(a.modeKey) - getModeSortRank(b.modeKey);
            if (modeRankDiff !== 0) return modeRankDiff;
          }

          return a.nameZh.localeCompare(b.nameZh);
        });

        return {
          category,
          rows: sortedRows,
        };
      });

    let ptSection: { category: PricingItem["category"]; rows: PtRow[] } | null = null;
    let cyclePlanRows:
      | {
          program: string;
          weeklySessions: string;
          wpdFollowups: string;
          assessmentsReports: string;
          minSessions: string;
          membershipGift: string;
          extraBenefits: string;
        }[]
      | null = null;

    if ((categoryFilter === "all" || categoryFilter === "personal_training") && grouped.personal_training.length > 0) {
      const ptMap = new Map<string, PtRow>();

      grouped.personal_training.forEach((item) => {
        const key = item.name_zh;
        if (!ptMap.has(key)) {
          ptMap.set(key, { key, itemIds: [item.id], nameZh: item.name_zh, nameEn: item.name_en });
        }

        const row = ptMap.get(key)!;
        if (!row.itemIds.includes(item.id)) row.itemIds.push(item.id);

        if (item.member_type === "member" && item.session_mode === "1v1") row.member1v1 = item.price;
        if (item.member_type === "member" && item.session_mode === "1v2") row.member1v2 = item.price;
        if (item.member_type === "non_member" && item.session_mode === "1v1") row.nonMember1v1 = item.price;
        if (item.member_type === "non_member" && item.session_mode === "1v2") row.nonMember1v2 = item.price;
      });

      ptSection = {
        category: "personal_training",
        rows: Array.from(ptMap.values()).sort((a, b) => {
          const aPrice = a.member1v1 ?? a.member1v2 ?? a.nonMember1v1 ?? a.nonMember1v2 ?? Number.MAX_SAFE_INTEGER;
          const bPrice = b.member1v1 ?? b.member1v2 ?? b.nonMember1v1 ?? b.nonMember1v2 ?? Number.MAX_SAFE_INTEGER;
          if (aPrice !== bPrice) return aPrice - bPrice;
          return a.nameZh.localeCompare(b.nameZh);
        }),
      };
    }

    if ((categoryFilter === "all" || categoryFilter === "cycle_plan") && grouped.cycle_plan.length > 0) {
      cyclePlanRows = grouped.cycle_plan
        .map((item) => {
          const weeks = asNumber(item.meta?.weeks) ?? null;
          const minSessions = asNumber(item.meta?.min_sessions) ?? null;
          const sessionsPerWeek = String(item.meta?.sessions_per_week ?? "2-4");

          const wpdFollowups = weeks === 6 ? "3" : weeks === 12 ? "6" : weeks === 24 ? "12" : "-";
          const assessmentsReports = weeks === 6 ? "2" : weeks === 12 ? "3" : weeks === 24 ? "6" : "-";
          const membershipGift = weeks ? `${weeks}-Week Membership / ${weeks}周会员` : "-";

          return {
            program: `${item.name_zh.includes("计划") ? item.name_zh : `${weeks ?? "-"}周计划`} / ${weeks ?? "-"}-Week Program`,
            weeklySessions: sessionsPerWeek,
            wpdFollowups,
            assessmentsReports,
            minSessions: minSessions ? String(minSessions) : "-",
            membershipGift,
            extraBenefits: "Member-rate packages / 会员价购买套餐课",
          };
        })
        .sort((a, b) => getCycleRankFromProgram(a.program) - getCycleRankFromProgram(b.program));
    }

    return { standardSections, ptSection, cyclePlanRows };
  }, [pricingItems, categoryFilter]);

  const rechargeResult = useMemo(() => {
    const matched = pricingRules
      .filter((r) => r.trigger_type === "recharge")
      .find((r) => {
        const gte = asNumber(r.trigger_json.amount_gte);
        const lt = asNumber(r.trigger_json.amount_lt);
        return (gte === null || recharge >= gte) && (lt === null || recharge < lt);
      });

    if (matched) {
      return {
        plan: String(matched.result_json.matched_plan ?? "Matched Plan"),
        benefits: Array.isArray(matched.result_json.benefits)
          ? matched.result_json.benefits.map((x) => String(x))
          : ["Rule based benefits"],
      };
    }

    if (recharge >= 9000) return { plan: "储值卡9000", benefits: ["赠送1年会员", "赠送金额1500", "赠送总价值3161"] };
    if (recharge >= 6000) return { plan: "储值卡6000", benefits: ["赠送6个月会员", "赠送金额600", "赠送总价值1314"] };
    if (recharge >= 3000) return { plan: "储值卡3000", benefits: ["赠送1个月会员", "赠送金额300", "赠送总价值595"] };
    return { plan: "未匹配档位", benefits: ["建议从$3000开始"] };
  }, [pricingRules, recharge]);

  const sessionResult = useMemo(() => {
    const matched = pricingRules
      .filter((r) => r.trigger_type === "buy_sessions")
      .find((r) => {
        const gte = asNumber(r.trigger_json.sessions_gte);
        const lt = asNumber(r.trigger_json.sessions_lt);
        return (gte === null || sessions >= gte) && (lt === null || sessions < lt);
      });

    if (matched) {
      return {
        plan: String(matched.result_json.matched_plan ?? "Matched Plan"),
        conditions: Array.isArray(matched.result_json.conditions)
          ? matched.result_json.conditions.map((x) => String(x)).join("，")
          : "参考计划条件",
      };
    }

    if (sessions >= 48) return { plan: "24周计划", conditions: "每周2-4次，最少48节" };
    if (sessions >= 24) return { plan: "12周计划", conditions: "每周2-4次，最少24节" };
    if (sessions >= 12) return { plan: "6周计划", conditions: "每周2-4次，最少12节" };
    return { plan: "未匹配计划", conditions: "建议至少12节" };
  }, [pricingRules, sessions]);

  const qaAnswer = useMemo(() => {
    if (/\d+/.test(question) && /充|充值|储值|recharge/.test(question)) {
      return `匹配方案：${rechargeResult.plan}。权益：${rechargeResult.benefits.join("、")}`;
    }
    if (/\d+/.test(question) && /课|节|session/.test(question)) {
      return `匹配计划：${sessionResult.plan}。条件：${sessionResult.conditions}`;
    }
    return "示例：冲6000有什么权益？ / What are the benefits for $6000 recharge?";
  }, [question, rechargeResult, sessionResult]);

  async function logQuery(queryText: string, intent: string, input: Record<string, unknown>, output: Record<string, unknown>) {
    if (!userId || presentationMode || clientDemoMode) return;
    try {
      await insertQueryLog({ userId, queryText, intent, input, output });
    } catch {
      // ignore
    }
  }

  async function handleSignIn() {
    setAuthError("");
    try {
      await signInWithPassword(email, password);
      const user = await getCurrentUser();
      setUserId(user?.id ?? null);
      setAuthState(user ? "authed" : "guest");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "登录失败");
    }
  }

  async function handleSignOut() {
    await signOut();
    setUserId(null);
    setAuthState("guest");
  }

  function openPtCalculator(row: PtRow) {
    setSelectedPtRow(row);
    setPtUnitMember1v1(row.member1v1 ?? 0);
    setPtUnitNonMember1v1(row.nonMember1v1 ?? 0);
    setPtUnitMember1v2(row.member1v2 ?? 0);
    setPtUnitNonMember1v2(row.nonMember1v2 ?? 0);
    setPtQtyMember1v1(12);
    setPtQtyNonMember1v1(12);
    setPtQtyMember1v2(12);
    setPtQtyNonMember1v2(12);
    setPtPreset("member_1v1");
  }

  function closePtCalculator() {
    setSelectedPtRow(null);
    setPtReportOpen(false);
  }

  const ptCalcMember1v1 = ptUnitMember1v1 * ptQtyMember1v1;
  const ptCalcNonMember1v1 = ptUnitNonMember1v1 * ptQtyNonMember1v1;
  const ptCalcMember1v2 = ptUnitMember1v2 * ptQtyMember1v2;
  const ptCalcNonMember1v2 = ptUnitNonMember1v2 * ptQtyNonMember1v2;

  const ptCalcMemberTotal = ptCalcMember1v1 + ptCalcMember1v2;
  const ptCalcNonMemberTotal = ptCalcNonMember1v1 + ptCalcNonMember1v2;
  const ptCalcGrandTotal = ptCalcMemberTotal + ptCalcNonMemberTotal;
  const ptCalcTax = ptCalcGrandTotal * 0.13;
  const ptCalcTotalWithTax = ptCalcGrandTotal + ptCalcTax;

  const ptActiveLabel =
    ptPreset === "member_1v1"
      ? "会员 1v1 / Member 1v1"
      : ptPreset === "non_member_1v1"
        ? "非会员 1v1 / Non-member 1v1"
        : ptPreset === "member_1v2"
          ? "会员 1v2 / Member 1v2"
          : "非会员 1v2 / Non-member 1v2";

  const ptActiveSubtotal =
    ptPreset === "member_1v1"
      ? ptCalcMember1v1
      : ptPreset === "non_member_1v1"
        ? ptCalcNonMember1v1
        : ptPreset === "member_1v2"
          ? ptCalcMember1v2
          : ptCalcNonMember1v2;

  const ptAfterCredit = Math.max(0, ptActiveSubtotal - ptCredit);
  const ptTaxAfterAdjust = ptAfterCredit * 0.13;
  const ptFinalTotal = ptAfterCredit + ptTaxAfterAdjust;

  const ptReportDate = new Date().toLocaleDateString("en-CA");

  const [ptClientName, setPtClientName] = useState("");

  async function handleCopyQuoteSummary() {
    if (!selectedPtRow) return;
    setPtCopySuccess(false);
    const unit =
      ptPreset === "member_1v1"
        ? ptUnitMember1v1
        : ptPreset === "non_member_1v1"
          ? ptUnitNonMember1v1
          : ptPreset === "member_1v2"
            ? ptUnitMember1v2
            : ptUnitNonMember1v2;
    const qty =
      ptPreset === "member_1v1"
        ? ptQtyMember1v1
        : ptPreset === "non_member_1v1"
          ? ptQtyNonMember1v1
          : ptPreset === "member_1v2"
            ? ptQtyMember1v2
            : ptQtyNonMember1v2;

    const summary = [
      `日期: ${ptReportDate}`,
      `客户姓名: ${ptClientName || "未填写"}`,
      `课程: ${selectedPtRow.nameZh}${selectedPtRow.nameEn ? ` / ${selectedPtRow.nameEn}` : ""}`,
      `方案: ${ptActiveLabel}`,
      `单价: ${formatMoney(unit)}`,
      `数量: ${qty}`,
      `小计: ${formatMoney(ptActiveSubtotal)}`,
      `积分抵扣: ${formatMoney(ptCredit)}`,
      `抵扣后金额: ${formatMoney(ptAfterCredit)}`,
      `税费(13%): ${formatMoney(ptTaxAfterAdjust)}`,
      `总计: ${formatMoney(ptFinalTotal)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setPtCopySuccess(true);
      setTimeout(() => setPtCopySuccess(false), 2000);
    } catch {
      setPtCopySuccess(false);
    }
  }

  function handleDownloadQuotePdf() {
    if (!selectedPtRow) return;

    const unit =
      ptPreset === "member_1v1"
        ? ptUnitMember1v1
        : ptPreset === "non_member_1v1"
          ? ptUnitNonMember1v1
          : ptPreset === "member_1v2"
            ? ptUnitMember1v2
            : ptUnitNonMember1v2;
    const qty =
      ptPreset === "member_1v1"
        ? ptQtyMember1v1
        : ptPreset === "non_member_1v1"
          ? ptQtyNonMember1v1
          : ptPreset === "member_1v2"
            ? ptQtyMember1v2
            : ptQtyNonMember1v2;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>OXYGEN Item Report</title>
  <style>
    :root {
      --bg: #070f1d;
      --panel: #0d182b;
      --line: rgba(255,255,255,.14);
      --text: #e6edf7;
      --muted: #9fb0c8;
      --brand: #8ff2d2;
      --brand-2: #55d7ff;
      --accent: #07261f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 28px;
    }
    .sheet {
      max-width: 920px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(180deg, #0a1424 0%, #07111f 100%);
    }
    .header {
      padding: 20px 22px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(90deg, rgba(143,242,210,.12), rgba(85,215,255,.08));
    }
    .eyebrow { font-size: 11px; letter-spacing: .12em; color: var(--muted); text-transform: uppercase; }
    h1 { margin: 6px 0 2px; font-size: 30px; color: var(--brand); }
    .sub { color: var(--muted); font-size: 16px; }

    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 14px 22px;
      border-bottom: 1px solid var(--line);
    }
    .meta-item {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(0,0,0,.2);
      padding: 10px 12px;
    }
    .k { color: var(--muted); font-size: 12px; }
    .v { margin-top: 4px; font-size: 20px; font-weight: 700; }

    .section { padding: 16px 22px; }
    .section h2 { margin: 0 0 10px; font-size: 18px; }

    table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    thead th {
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
      color: var(--muted);
      background: rgba(255,255,255,.04);
      border-bottom: 1px solid var(--line);
    }
    tbody td {
      padding: 12px;
      border-bottom: 1px solid var(--line);
      font-size: 15px;
    }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr.active { background: linear-gradient(90deg, rgba(143,242,210,.10), rgba(85,215,255,.06)); }

    .summary {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(0,0,0,.2);
      padding: 10px 12px;
    }
    .total {
      grid-column: 1 / -1;
      background: linear-gradient(90deg, rgba(143,242,210,.18), rgba(85,215,255,.10));
      border-color: rgba(143,242,210,.45);
    }
    .total .v { font-size: 32px; color: var(--brand); }

    .footer {
      padding: 12px 22px 18px;
      color: var(--muted);
      font-size: 12px;
    }

    @media print {
      body { background: #fff; color: #0f172a; padding: 0; }
      .sheet { border: none; border-radius: 0; background: #fff; }
      .header { background: #f8fafc; }
      .eyebrow, .sub, .k, .footer { color: #475569; }
      h1 { color: #0f766e; }
      .meta-item, table, .card { border-color: #cbd5e1; background: #fff; }
      .total { background: #ecfeff; border-color: #99f6e4; }
      .total .v { color: #0f766e; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="eyebrow">ITEM REPORT / 项目报告单</div>
      <h1>${selectedPtRow.nameZh}</h1>
      <div class="sub">${selectedPtRow.nameEn ?? ""}</div>
    </div>

    <div class="meta">
      <div class="meta-item"><div class="k">Date / 日期</div><div class="v">${ptReportDate}</div></div>
      <div class="meta-item"><div class="k">Client Name / 客户姓名</div><div class="v">${ptClientName || "N/A"}</div></div>
    </div>

    <div class="section">
      <h2>项目明细 / Item Details</h2>
      <table>
        <thead>
          <tr>
            <th>项目 / Item</th>
            <th>单价 / Unit</th>
            <th>数量 / Qty</th>
            <th>小计 / Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr class="active">
            <td>${ptActiveLabel}</td>
            <td>${formatMoney(unit)}</td>
            <td>${qty}</td>
            <td>${formatMoney(ptActiveSubtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <div class="card"><div class="k">Credit / 积分抵扣</div><div class="v">${formatMoney(ptCredit)}</div></div>
        <div class="card"><div class="k">After Credit / 抵扣后金额</div><div class="v">${formatMoney(ptAfterCredit)}</div></div>
        <div class="card"><div class="k">Tax (13%) / 税费</div><div class="v">${formatMoney(ptTaxAfterAdjust)}</div></div>
        <div class="card total"><div class="k">Total / 总计</div><div class="v">${formatMoney(ptFinalTotal)}</div></div>
      </div>
    </div>

    <div class="footer">This report is for quotation reference. Final amount is subject to contract terms. / 本报告用于报价参考，最终金额以合同为准。</div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=980,height=760");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  function resetPtCalculator() {
    setPtQtyMember1v1(12);
    setPtQtyNonMember1v1(12);
    setPtQtyMember1v2(12);
    setPtQtyNonMember1v2(12);
  }

  function applyPtPreset(preset: "member_1v1" | "non_member_1v1" | "member_1v2" | "non_member_1v2") {
    setPtPreset(preset);
    setPtQtyMember1v1(preset === "member_1v1" ? 12 : 0);
    setPtQtyNonMember1v1(preset === "non_member_1v1" ? 12 : 0);
    setPtQtyMember1v2(preset === "member_1v2" ? 12 : 0);
    setPtQtyNonMember1v2(preset === "non_member_1v2" ? 12 : 0);
  }

  function restorePtUnitPrices() {
    if (!selectedPtRow) return;
    setPtUnitMember1v1(selectedPtRow.member1v1 ?? 0);
    setPtUnitNonMember1v1(selectedPtRow.nonMember1v1 ?? 0);
    setPtUnitMember1v2(selectedPtRow.member1v2 ?? 0);
    setPtUnitNonMember1v2(selectedPtRow.nonMember1v2 ?? 0);
  }

  if (authState === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-[#05070d] text-slate-300">Loading...</div>;
  }

  if (authState === "guest") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#03050b] px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#0a0f1b] p-7 shadow-2xl">
          <h1 className="text-2xl font-semibold">Sales Login / 销售登录</h1>
          <p className="mt-2 text-sm text-slate-400">Internal system only / 内部系统</p>
          <label className="mt-4 block text-sm">Email / 邮箱</label>
          <input className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mt-3 block text-sm">Password / 密码</label>
          <input type="password" className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          {authError && <p className="mt-3 text-sm text-rose-400">{authError}</p>}
          <button onClick={handleSignIn} className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-950">Sign In / 登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03050b] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,163,0.18),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.14),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:3px_3px] [background-image:radial-gradient(rgba(255,255,255,0.4)_0.4px,transparent_0.4px)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-24">
        <header className={`${glass} p-4 md:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Oxygen<span className="text-emerald-300">Pricing</span>
              </h1>
              <p className="mt-1 text-xs text-slate-400">Sales Console · 深色科技风重构版</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPresentationMode((v) => !v)}
                className={`${solidButtonBase} text-xs ${presentationMode ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : ""}`}
              >
                {presentationMode ? "Presentation: ON" : "Presentation: OFF"}
              </button>
              <button
                onClick={() => setClientDemoMode((v) => !v)}
                className={`${solidButtonBase} text-xs ${clientDemoMode ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : ""}`}
              >
                {clientDemoMode ? "Client Demo: ON" : "Client Demo: OFF"}
              </button>
              <button onClick={handleSignOut} className={`${solidButtonBase} text-xs bg-rose-500/90 hover:bg-rose-400/90`}>
                Sign out / 退出
              </button>
            </div>
          </div>

          {!clientDemoMode && (
            <div className="mt-5 flex flex-wrap gap-2">
              {([
                ["pricing", "Pricing"],
                ["calculator", "Calculator"],
                ["qa", "Q&A"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`${solidButtonBase} px-4 py-2 text-sm ${
                    tab === value
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "bg-slate-700/90 text-slate-100 hover:bg-slate-600/90"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </header>

        <section className={`${glass} mt-4 p-4`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-emerald-200">Promotion Highlights / 规则高亮</h2>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
              Additional Promotions & Benefits
            </span>
          </div>

          <div className="mt-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {promotionGroups.map((group) => (
                <button
                  key={group.key}
                  onClick={() => setActivePromotionGroup(group.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activePromotionGroup === group.key
                      ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
                      : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-emerald-300/30 hover:text-emerald-100"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(promotionGroups.find((g) => g.key === activePromotionGroup)?.items ?? promotionGroups[0]?.items ?? []).map((promo, index) => {
                const isActive = pricingRules.some((r) => r.rule_code === promo.trigger.replace("Policy: ", ""));
                return (
                  <div
                    key={promo.trigger}
                    className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                      isActive
                        ? "border-emerald-300/45 bg-gradient-to-br from-emerald-400/15 via-emerald-500/10 to-transparent shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                        : "border-white/12 bg-white/[0.03] hover:border-emerald-300/25 hover:bg-emerald-500/[0.06]"
                    }`}
                  >
                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />

                    <div className="relative flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isActive ? "bg-emerald-300/90 text-slate-950" : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5 text-slate-100">{promo.title}</p>
                        <p className="mt-1.5 text-xs leading-5 text-slate-300">{promo.detail}</p>
                        <p
                          className={`mt-3 inline-flex rounded-md border px-2 py-1 text-[10px] tracking-wide ${
                            isActive
                              ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-100"
                              : "border-white/10 bg-slate-800/60 text-slate-400"
                          }`}
                        >
                          {promo.trigger}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {(tab === "pricing" || clientDemoMode) && (
          <section className="mt-5 space-y-5">
            {!clientDemoMode && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`${solidButtonBase} text-sm ${
                    categoryFilter === "all"
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "bg-slate-700/90 text-slate-100 hover:bg-slate-600/90"
                  }`}
                >
                  全部
                </button>
                {(Object.keys(categoryMeta) as PricingItem["category"][]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`${solidButtonBase} text-sm ${
                      categoryFilter === cat
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "bg-slate-700/90 text-slate-100 hover:bg-slate-600/90"
                    }`}
                  >
                    {categoryMeta[cat].zh}
                  </button>
                ))}
              </div>
            )}

            {groupedSections.standardSections.map(({ category, rows }) => (
              <article key={category} className={`${glass} p-4`}>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  {categoryMeta[category].en} · {categoryMeta[category].zh}
                </h3>

                <div
                  className={
                    category === "membership"
                      ? "space-y-2"
                      : category === "group_class"
                        ? "space-y-2"
                        : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                  }
                >
                  {(category === "membership"
                    ? (() => {
                        const pickByType = new Map<number, (typeof rows)[number]>();
                        const getType = (nameZh: string) => {
                          const n = nameZh.toLowerCase();
                          if (n.includes("vip") || n.includes("plus")) return -1;
                          if (n.includes("日") || n.includes("day")) return 0;
                          if (n.includes("周") || n.includes("week")) return 1;
                          if (n.includes("年") || n.includes("year") || n.includes("annual")) return 3;
                          if (n.includes("月") || n.includes("month") || n.includes("monthly")) return 2;
                          return -1;
                        };

                        rows.forEach((row) => {
                          const t = getType(row.nameZh);
                          if (t >= 0 && !pickByType.has(t)) pickByType.set(t, row);
                        });

                        return [0, 1, 2, 3].map((t) => pickByType.get(t)).filter(Boolean) as typeof rows;
                      })()
                    : rows
                  ).map((row, index) => {
                    if (category === "membership") {
                      const membershipPrice = row.generalPrice ?? row.nonMemberPrice ?? row.memberPrice;
                      const name = row.nameZh.toLowerCase();

                      const cycleLabel =
                        name.includes("日") || name.includes("day")
                          ? "日卡 / Day Pass"
                          : name.includes("周") || name.includes("week")
                            ? "周卡 / Week Pass"
                            : name.includes("年") || name.includes("year") || name.includes("annual")
                              ? "年卡 / Annual Pass"
                              : name.includes("月") || name.includes("month") || name.includes("monthly")
                                ? "月卡 / Month Pass"
                                : "会籍 / Membership";

                      const isMonthly = name.includes("月") || name.includes("month") || name.includes("monthly");
                      const isAnnual = name.includes("年") || name.includes("year") || name.includes("annual");

                      const coreAccessItems = [
                        "全日入场 / FULL DAY CLUB ENTRY",
                        "餐饮与餐厅区 / OXYGEN BAR & CAFE",
                        "力量、有氧、训练、拉伸区、拳击区 / STRENGTH AREA · CARDIO AREA · STRETCHING AREA · BOXING AREA",
                        "全面体脂测试与详细报告 / BODY COMPOSITION SCAN + REPORT",
                        "电影、桌游、娱乐区 / LOUNGE & RECREATION AREA",
                        "私人储物柜 / PRIVATE KEYLESS LOCKERS",
                        "舒缓干桑拿 / THERAPY DRY SAUNA",
                        "私人洗浴间 / PRIVATE SHOWER",
                      ];

                      const bonusItems = isAnnual
                        ? [
                            { zh: "饮品券", en: "Drink Voucher", qty: 3, icon: CupSoda },
                            { zh: "餐券", en: "Meal Voucher", qty: 3, icon: UtensilsCrossed },
                            { zh: "周卡券", en: "Weekly Pass", qty: 3, icon: CalendarDays },
                          ]
                        : isMonthly
                          ? [
                              { zh: "饮品券", en: "Drink Voucher", qty: 1, icon: CupSoda },
                              { zh: "餐券", en: "Meal Voucher", qty: 1, icon: UtensilsCrossed },
                              { zh: "周卡券", en: "Weekly Pass", qty: 1, icon: CalendarDays },
                            ]
                          : [];

                      const activationFeeText = isAnnual
                        ? "$120（年卡一次性付清可免） / $120 (Waived only with annual full payment)"
                        : isMonthly
                          ? "$120（需收取） / $120 (Applied)"
                          : "-";

                      return (
                        <article key={row.key} className="border-b border-white/10 py-3 last:border-b-0">
                          <div className="grid gap-2 md:grid-cols-[1.2fr_1.1fr_2.2fr] md:items-start">
                            <div>
                              <p className="font-semibold text-white">{index + 1}. {row.nameZh}</p>
                              <p className="text-xs text-slate-400">周期 / Cycle: {cycleLabel}</p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-500">会籍价格 / Membership Price</p>
                              <p className="font-semibold text-emerald-200">{formatMoney(membershipPrice ?? undefined)}</p>
                              <p className="mt-1 text-[10px] text-slate-500">激活费 / Activation Fee</p>
                              <p className="text-xs text-amber-200">{activationFeeText}</p>
                            </div>

                            <div className="overflow-hidden rounded-md border border-white/10">
                              <div className="grid grid-cols-2 bg-white/[0.02] text-[10px] text-slate-500">
                                <div className="border-r border-white/10 px-2 py-1">核心权益 / Core Access</div>
                                <div className="px-2 py-1">加赠福利 / Bonus</div>
                              </div>
                              <div className="grid grid-cols-2 text-xs">
                                <div className="border-r border-white/10 px-2 py-2 text-slate-300">
                                  <ul className="list-disc space-y-1 pl-4 text-xs">
                                    {coreAccessItems.map((item) => (
                                      <li key={item}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="px-2 py-2 text-slate-300">
                                  {bonusItems.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {bonusItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                          <div
                                            key={item.zh}
                                            className="relative overflow-hidden rounded-lg border border-amber-300/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 px-2 py-1.5"
                                          >
                                            <div className="absolute -right-4 -top-4 h-10 w-10 rounded-full bg-amber-300/10 blur-md" />
                                            <div className="flex items-start gap-2">
                                              <div className="mt-0.5 rounded-md border border-amber-200/25 bg-amber-400/10 p-1 text-amber-200">
                                                <Icon size={12} />
                                              </div>
                                              <div className="leading-tight">
                                                <p className="text-[11px] font-semibold text-amber-100">
                                                  {item.zh} ×{item.qty}
                                                </p>
                                                <p className="text-[10px] text-amber-200/80">{item.en}</p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">无 / None</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    const saveAmount =
                      typeof row.memberPrice === "number" && typeof row.nonMemberPrice === "number"
                        ? row.nonMemberPrice - row.memberPrice
                        : null;
                    const savePercent =
                      saveAmount !== null && row.nonMemberPrice
                        ? (saveAmount / row.nonMemberPrice) * 100
                        : null;

                    const groupClassDays = category === "group_class" ? getGroupClassDays(row.modeKey) : null;
                    const memberPerDay =
                      groupClassDays && typeof row.memberPrice === "number" ? row.memberPrice / groupClassDays : null;
                    const nonMemberPerDay =
                      groupClassDays && typeof row.nonMemberPrice === "number" ? row.nonMemberPrice / groupClassDays : null;

                    if (category === "group_class") {
                      return (
                        <article key={row.key} className="py-2">
                          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-[#0b1320]/60 text-xs md:grid-cols-6 md:text-sm">
                            <div className="col-span-2 border-b border-white/10 px-3 py-2 md:col-span-2 md:border-b-0 md:border-r">
                              <p className="font-semibold text-white">{index + 1}. {row.nameZh}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400">模式 / Mode: {row.mode ?? "-"}</p>
                              <p className="text-[11px] text-slate-500">周期 / Duration: {groupClassDays ? `${groupClassDays} 天 / days` : "-"}</p>
                            </div>

                            <div className="border-b border-r border-white/10 px-3 py-2 md:border-b-0">
                              <p className="text-[10px] text-slate-500">会员价 / Member</p>
                              <p className="font-semibold text-emerald-200">{formatMoney(row.memberPrice)}</p>
                            </div>

                            <div className="border-b border-white/10 px-3 py-2 md:border-b-0 md:border-r">
                              <p className="text-[10px] text-slate-500">非会员 / Non-member</p>
                              <p className="font-semibold text-amber-200">{formatMoney(row.nonMemberPrice)}</p>
                            </div>

                            <div className="border-r border-white/10 px-3 py-2">
                              <p className="text-[10px] text-slate-500">会员日均 / Member per day</p>
                              <p className="text-cyan-200">{memberPerDay !== null ? `$${memberPerDay.toFixed(2)}` : "-"}</p>
                            </div>

                            <div className="px-3 py-2">
                              <p className="text-[10px] text-slate-500">非会员日均 / Non-member per day</p>
                              <p className="text-cyan-100">{nonMemberPerDay !== null ? `$${nonMemberPerDay.toFixed(2)}` : "-"}</p>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    return (
                      <article
                        key={row.key}
                        className="rounded-2xl border border-white/10 bg-[#090f1a] p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/40"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{row.nameZh}</p>
                            {category === "assessment" && row.nameEn && <p className="text-xs text-slate-400">{row.nameEn}</p>}
                            {row.mode && <p className="text-xs text-slate-400">{row.mode}</p>}
                          </div>
                        </div>

                        <div className={`grid gap-2 text-sm ${typeof row.nonMemberPrice === "number" && category !== "assessment" ? "grid-cols-2" : "grid-cols-1"}`}>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{category === "assessment" ? "通用价" : "会员价"}</p>
                            <p className="mt-1 text-xl font-semibold text-emerald-200">{formatMoney(category === "assessment" ? (row.generalPrice ?? row.memberPrice) : row.memberPrice)}</p>
                          </div>
                          {category !== "assessment" && typeof row.nonMemberPrice === "number" && (
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">非会员</p>
                              <p className="mt-1 text-xl font-semibold text-amber-200">{formatMoney(row.nonMemberPrice)}</p>
                            </div>
                          )}
                        </div>

                        {category !== "assessment" && typeof row.generalPrice === "number" && (
                          <p className="mt-2 text-xs text-sky-200">通用价：{formatMoney(row.generalPrice)}</p>
                        )}

                        {saveAmount !== null && (
                          <p className="mt-2 text-xs text-slate-300">
                            节省 {formatMoney(saveAmount)} ({formatPercent(savePercent ?? undefined)})
                          </p>
                        )}

                        {row.itemIds.flatMap((id) => benefitsByItemId.get(id) ?? []).length > 0 && (
                          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-slate-300">
                            {Array.from(new Set(row.itemIds.flatMap((id) => benefitsByItemId.get(id) ?? []))).join(" / ")}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                {category === "membership" && (
                  <div className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-4">
                    <h4 className="text-sm font-semibold text-cyan-100">Annual Membership Benefits</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                      {annualMembershipBenefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}

            {(categoryFilter === "all" || categoryFilter === "stored_value") && (
              <article className={`${glass} p-4`}>
                <h3 className="mb-3 text-lg font-semibold text-white">Store Credit / 储值计划</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {rechargePlans.map((plan) => (
                    <div key={plan.amount} className="rounded-2xl border border-white/10 bg-[#090f1a] p-4">
                      <p className="text-xs text-slate-400">{plan.amountZh}</p>
                      <p className="text-2xl font-bold text-emerald-200">{plan.amount}</p>
                      <p className="mt-2 text-sm text-slate-200">{plan.membershipGift}</p>
                      <p className="text-xs text-slate-400">{plan.membershipGiftZh}</p>
                      <p className="mt-2 text-sm text-cyan-200">Bonus: {plan.bonusCredit}</p>
                      <p className="text-sm text-emerald-200">Total: {plan.totalValue}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {groupedSections.ptSection && (
              <article className={`${glass} p-4`}>
                <div className="mb-4 flex items-end justify-between">
                  <h3 className="text-lg font-semibold text-white">Personal Training / 私教课程</h3>
                  <p className="text-xs text-slate-400">分栏清单布局 / Split-list layout</p>
                </div>

                <div className="space-y-3">
                  {groupedSections.ptSection.rows.map((row, index) => {
                    const info = personalTrainingProgramInfo[row.nameZh];
                    const ProgramIcon = info?.icon ?? Activity;
                    return (
                      <article
                        key={row.key}
                        onClick={() => openPtCalculator(row)}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-black px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all duration-500 hover:border-emerald-300/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]"
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-xl border border-emerald-300/0 opacity-0 transition-all duration-500 group-hover:border-emerald-300/35 group-hover:opacity-100" />
                        <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-400/0 via-emerald-300/20 to-cyan-300/0 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-[pulse_2.8s_ease-in-out_infinite]" />

                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 rounded-md border border-emerald-300/30 bg-emerald-500/10 p-1.5">
                              <ProgramIcon size={14} className="text-emerald-200" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{index + 1}. {row.nameZh}</p>
                              {row.nameEn && <p className="text-xs text-slate-400">{row.nameEn}</p>}
                            </div>
                          </div>
                          <span className="inline-flex items-center text-[11px] text-emerald-200/90">
                            <span className="h-2 w-2 rounded-full bg-emerald-300/90 shadow-[0_0_8px_rgba(52,211,153,0.8)] opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:animate-[pulse_2.8s_ease-in-out_infinite]" />
                          </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="text-xs">
                            <p className="text-slate-500">训练重点 / Training Focus</p>
                            <p className="mt-1 text-slate-300">{info?.focus ?? "-"}</p>
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-500">适合人群 / Ideal For</p>
                            <p className="mt-1 text-slate-300">{info?.idealFor ?? "-"}</p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                          <div className="border-l-2 border-emerald-300/40 pl-2">
                            <p className="text-slate-500">1v1 定价 / 1v1 Pricing</p>
                            <p className="text-slate-300">会员 / Member: <span className="font-semibold text-emerald-200">{formatMoney(row.member1v1)}</span></p>
                            <p className="text-slate-300">非会员 / Non-member: <span className="font-semibold text-amber-200">{formatMoney(row.nonMember1v1)}</span></p>
                          </div>
                          <div className="border-l-2 border-cyan-300/40 pl-2">
                            <p className="text-slate-500">1v2 定价 / 1v2 Pricing</p>
                            <p className="text-slate-300">会员 / Member: <span className="font-semibold text-emerald-200">{formatMoney(row.member1v2)}</span></p>
                            <p className="text-slate-300">非会员 / Non-member: <span className="font-semibold text-amber-200">{formatMoney(row.nonMember1v2)}</span></p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </article>
            )}

            {groupedSections.cyclePlanRows && (
              <article className={`${glass} p-4`}>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-xl font-bold tracking-tight text-white">Cycle Plans / 周期计划</h3>
                  <p className="text-xs font-medium text-cyan-200">Timeline Ledger</p>
                </div>

                <div className="space-y-2">
                  {groupedSections.cyclePlanRows.map((row, idx) => (
                    <section key={row.program} className="border-l-2 border-cyan-300/50 bg-[#070f1b] px-4 py-3">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-[240px]">
                          <p className="font-mono text-[11px] uppercase tracking-[0.16em] font-medium text-cyan-200/90">T{String(idx + 1).padStart(2, "0")}</p>
                          <p className="mt-1 text-base font-semibold text-white">{row.program}</p>
                        </div>

                        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-[11px] font-medium text-slate-400">每周次数</p>
                            <p className="font-semibold text-cyan-50">{row.weeklySessions}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-400">最少课时</p>
                            <p className="font-semibold text-cyan-50">{row.minSessions}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-400">跟进次数</p>
                            <p className="font-semibold text-cyan-50">{row.wpdFollowups}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-400">评估报告</p>
                            <p className="font-semibold text-cyan-50">{row.assessmentsReports}</p>
                          </div>
                        </div>

                        <div className="min-w-[320px] space-y-1.5 text-sm">
                          <p className="font-medium text-emerald-100">赠送会籍：<span className="font-semibold text-emerald-50">{row.membershipGift}</span></p>
                          <p className="font-medium text-cyan-100">额外权益：<span className="font-semibold text-cyan-50">{row.extraBenefits}</span></p>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            )}
          </section>
        )}

        {!clientDemoMode && tab === "calculator" && (
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className={`${glass} p-5`}>
              <h2 className="text-lg font-semibold text-white">Recharge Calculator</h2>
              <label className="mt-3 block text-sm">Amount ($)</label>
              <input
                type="number"
                value={recharge}
                onChange={(e) => setRecharge(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2"
              />
              <p className="mt-3 text-sm text-slate-300">Plan: <span className="text-emerald-200">{rechargeResult.plan}</span></p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {rechargeResult.benefits.map((b) => <li key={b}>{b}</li>)}
              </ul>
              {!presentationMode && (
                <button
                  onClick={() => logQuery(`recharge:${recharge}`, "recharge", { recharge }, rechargeResult)}
                  className={`${solidButtonBase} mt-4 py-2 text-sm bg-indigo-500/90 hover:bg-indigo-400/90`}
                >
                  Save log
                </button>
              )}
            </article>

            <article className={`${glass} p-5`}>
              <h2 className="text-lg font-semibold text-white">Sessions Calculator</h2>
              <label className="mt-3 block text-sm">Sessions</label>
              <input
                type="number"
                value={sessions}
                onChange={(e) => setSessions(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2"
              />
              <p className="mt-3 text-sm text-slate-300">Plan: <span className="text-indigo-200">{sessionResult.plan}</span></p>
              <p className="mt-1 text-sm text-slate-300">{sessionResult.conditions}</p>
              {!presentationMode && (
                <button
                  onClick={() => logQuery(`sessions:${sessions}`, "sessions", { sessions }, sessionResult)}
                  className={`${solidButtonBase} mt-4 py-2 text-sm bg-indigo-500/90 hover:bg-indigo-400/90`}
                >
                  Save log
                </button>
              )}
            </article>
          </section>
        )}

        {!clientDemoMode && tab === "qa" && (
          <section className={`${glass} mt-5 p-5`}>
            <h2 className="text-lg font-semibold text-white">Q&A Assistant</h2>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2"
            />
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">{qaAnswer}</div>
            {!presentationMode && (
              <button
                onClick={() => logQuery(question, "qa", { question }, { qaAnswer })}
                className={`${solidButtonBase} mt-4 py-2 text-sm bg-indigo-500/90 hover:bg-indigo-400/90`}
              >
                Save log
              </button>
            )}
          </section>
        )}

      {selectedPtRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xl">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-white/15 bg-[#0f1115]/92 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] tracking-[0.08em] text-slate-500">课程价格计算器 / Course Pricing Calculator</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">{selectedPtRow.nameZh}</h3>
                  {selectedPtRow.nameEn && <p className="text-sm text-slate-400">{selectedPtRow.nameEn}</p>}
                </div>
                <button
                  onClick={closePtCalculator}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-100 hover:bg-white/[0.08]"
                >
                  <X size={14} />
                  关闭
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
              <section className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="mb-3 text-sm font-medium text-slate-200">方案与参数 / Plan & Inputs</p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["member_1v1", "会员 1v1", <User key="i1" size={14} className="text-emerald-200" />],
                      ["non_member_1v1", "非会员 1v1", <User key="i2" size={14} className="text-amber-200" />],
                      ["member_1v2", "会员 1v2", <Users key="i3" size={14} className="text-emerald-200" />],
                      ["non_member_1v2", "非会员 1v2", <Users key="i4" size={14} className="text-amber-200" />],
                    ].map(([key, label, icon]) => (
                      <button
                        key={key}
                        onClick={() => applyPtPreset(key as "member_1v1" | "non_member_1v1" | "member_1v2" | "non_member_1v2")}
                        className={`inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${
                          ptPreset === key
                            ? "border-emerald-300/60 bg-emerald-500/16 text-emerald-100"
                            : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-emerald-300/30"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">{icon}<span>{label}</span></span>
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  {
                    key: "member_1v1",
                    label: "1v1 会员 / 1v1 Member",
                    icon: <User size={16} className="text-emerald-200" />,
                    unit: ptUnitMember1v1,
                    setUnit: setPtUnitMember1v1,
                    qty: ptQtyMember1v1,
                    setQty: setPtQtyMember1v1,
                  },
                  {
                    key: "non_member_1v1",
                    label: "1v1 非会员 / 1v1 Non-member",
                    icon: <User size={16} className="text-amber-200" />,
                    unit: ptUnitNonMember1v1,
                    setUnit: setPtUnitNonMember1v1,
                    qty: ptQtyNonMember1v1,
                    setQty: setPtQtyNonMember1v1,
                  },
                  {
                    key: "member_1v2",
                    label: "1v2 会员 / 1v2 Member",
                    icon: <Users size={16} className="text-emerald-200" />,
                    unit: ptUnitMember1v2,
                    setUnit: setPtUnitMember1v2,
                    qty: ptQtyMember1v2,
                    setQty: setPtQtyMember1v2,
                  },
                  {
                    key: "non_member_1v2",
                    label: "1v2 非会员 / 1v2 Non-member",
                    icon: <Users size={16} className="text-amber-200" />,
                    unit: ptUnitNonMember1v2,
                    setUnit: setPtUnitNonMember1v2,
                    qty: ptQtyNonMember1v2,
                    setQty: setPtQtyNonMember1v2,
                  },
                ]
                  .filter((line) => line.key === ptPreset)
                  .map((line) => (
                    <div key={line.label} className="rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-emerald-500/8 to-cyan-500/8 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100">{line.icon}{line.label}</p>
                        <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[11px] text-slate-300">默认 12 课时</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                        <div>
                          <label className="text-[11px] text-slate-400">单价 / Unit Price</label>
                          <input
                            type="number"
                            value={ptUnitInputEmpty ? "" : String(line.unit)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setPtUnitInputEmpty(true);
                                line.setUnit(0);
                                return;
                              }
                              setPtUnitInputEmpty(false);
                              line.setUnit(Number(raw));
                            }}
                            onBlur={() => {
                              if (ptUnitInputEmpty) {
                                setPtUnitInputEmpty(false);
                                line.setUnit(0);
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">数量 / Quantity</label>
                          <input
                            type="number"
                            value={ptQtyInputEmpty ? "" : String(line.qty)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setPtQtyInputEmpty(true);
                                line.setQty(0);
                                return;
                              }
                              setPtQtyInputEmpty(false);
                              line.setQty(Number(raw));
                            }}
                            onBlur={() => {
                              if (ptQtyInputEmpty) {
                                setPtQtyInputEmpty(false);
                                line.setQty(0);
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[12, 24, 36, 48].map((q) => (
                          <button
                            key={q}
                            onClick={() => line.setQty(q)}
                            className={`rounded-lg border px-3 py-1 text-xs transition ${
                              line.qty === q
                                ? "border-emerald-300/60 bg-emerald-500/18 text-emerald-100"
                                : "border-white/12 text-slate-300 hover:border-emerald-300/30"
                            }`}
                          >
                            {q} 课时
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

              </section>

              <aside className="rounded-2xl border border-emerald-300/30 bg-gradient-to-b from-emerald-500/14 via-emerald-500/8 to-cyan-500/10 p-4">
                <p className="text-sm font-medium text-emerald-100">方案汇总 / Plan Summary</p>
                <div className="mt-2 rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                  <p className="text-[11px] text-slate-400">当前方案 / Active Plan</p>
                  <p className="text-sm font-medium text-emerald-100">{ptActiveLabel}</p>
                </div>

                <div className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">单价 / Unit Price</span>
                    <span className="font-medium text-slate-100">
                      {formatMoney(
                        ptPreset === "member_1v1"
                          ? ptUnitMember1v1
                          : ptPreset === "non_member_1v1"
                            ? ptUnitNonMember1v1
                            : ptPreset === "member_1v2"
                              ? ptUnitMember1v2
                              : ptUnitNonMember1v2,
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-slate-300">数量 / Quantity</span>
                    <span className="font-medium text-slate-100">
                      {ptPreset === "member_1v1"
                        ? ptQtyMember1v1
                        : ptPreset === "non_member_1v1"
                          ? ptQtyNonMember1v1
                          : ptPreset === "member_1v2"
                            ? ptQtyMember1v2
                            : ptQtyNonMember1v2}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-slate-300">小计 / Subtotal</span>
                    <span className="font-semibold text-emerald-200">{formatMoney(ptActiveSubtotal)}</span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">积分抵扣 / Credit</span>
                      <input
                        type="number"
                        value={ptCreditInputEmpty ? "" : String(ptCredit)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setPtCreditInputEmpty(true);
                            setPtCredit(0);
                            return;
                          }
                          setPtCreditInputEmpty(false);
                          setPtCredit(Number(raw));
                        }}
                        onBlur={() => {
                          if (ptCreditInputEmpty) {
                            setPtCreditInputEmpty(false);
                            setPtCredit(0);
                          }
                        }}
                        className="w-28 rounded-md border border-white/15 bg-black/35 px-2 py-1 text-right text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-slate-300">抵扣后金额 / After Credit</span>
                    <span className="font-semibold text-emerald-200">{formatMoney(ptAfterCredit)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-slate-300">税费 / Tax (13%)</span>
                    <span className="font-semibold text-cyan-200">{formatMoney(ptTaxAfterAdjust)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2">
                    <span className="text-slate-100">总计 / Total</span>
                    <span className="text-lg font-bold text-emerald-100">{formatMoney(ptFinalTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setPtReportOpen(true)}
                  className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  生成报告单 / Generate Report
                </button>
                <p className="mt-2 text-[11px] text-slate-400">价格仅供销售演示，最终以合同为准 / For quotation preview only.</p>
              </aside>
            </div>
          </div>
        </div>
      )}

      {ptReportOpen && selectedPtRow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 backdrop-blur-md">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-emerald-300/25 bg-gradient-to-b from-[#071326] via-[#07111f] to-[#050b16] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.72)]">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Quotation Report / 报告单</p>
                <h3 className="text-2xl font-semibold text-emerald-100">{selectedPtRow.nameZh}</h3>
                {selectedPtRow.nameEn && <p className="text-sm text-slate-300">{selectedPtRow.nameEn}</p>}
              </div>
              <button
                onClick={() => setPtReportOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
              >
                <X size={14} />
                关闭
              </button>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">日期 / Date</p>
                <p className="font-medium text-slate-100">{ptReportDate}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[11px] text-slate-400">客户姓名 / Client Name</p>
                <input
                  value={ptClientName}
                  onChange={(e) => setPtClientName(e.target.value)}
                  placeholder="请输入客户姓名 / Enter client name"
                  className="mt-1 w-full rounded-md border border-white/15 bg-black/35 px-2 py-1 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="mb-3 text-sm font-medium text-slate-100">项目明细 / Item Details</p>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] bg-white/[0.05] px-4 py-2 text-[11px] tracking-wide text-slate-400">
                  <p>项目 / Item</p>
                  <p>单价 / Unit</p>
                  <p>数量 / Qty</p>
                  <p>小计 / Subtotal</p>
                </div>

                {[
                  { key: "member_1v1", label: "1v1 会员 / Member", unit: ptUnitMember1v1, qty: ptQtyMember1v1, subtotal: ptCalcMember1v1 },
                  { key: "non_member_1v1", label: "1v1 非会员 / Non-member", unit: ptUnitNonMember1v1, qty: ptQtyNonMember1v1, subtotal: ptCalcNonMember1v1 },
                  { key: "member_1v2", label: "1v2 会员 / Member", unit: ptUnitMember1v2, qty: ptQtyMember1v2, subtotal: ptCalcMember1v2 },
                  { key: "non_member_1v2", label: "1v2 非会员 / Non-member", unit: ptUnitNonMember1v2, qty: ptQtyNonMember1v2, subtotal: ptCalcNonMember1v2 },
                ]
                  .filter((line) => line.key === ptPreset)
                  .map((line) => (
                    <div key={line.key} className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-t border-white/10 bg-emerald-500/10 px-4 py-2.5 text-sm">
                      <p className="text-slate-200">{line.label}</p>
                      <p className="text-slate-300">{formatMoney(line.unit)}</p>
                      <p className="text-slate-300">{line.qty}</p>
                      <p className="font-medium text-emerald-200">{formatMoney(line.subtotal)}</p>
                    </div>
                  ))}
              </div>

              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] text-slate-400">当前方案 / Active Plan</p>
                  <p className="font-medium text-emerald-100">{ptActiveLabel}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] text-slate-400">积分抵扣 / Credit</p>
                  <p className="font-medium text-cyan-200">{formatMoney(ptCredit)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] text-slate-400">抵扣后金额 / After Credit</p>
                  <p className="font-semibold text-emerald-200">{formatMoney(ptAfterCredit)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-[11px] text-slate-400">税费 / Tax (13%)</p>
                  <p className="font-semibold text-cyan-200">{formatMoney(ptTaxAfterAdjust)}</p>
                </div>
                <div className="rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-3 py-2 md:col-span-2">
                  <p className="text-[11px] text-slate-300">总计 / Total</p>
                  <p className="text-2xl font-bold text-emerald-100">{formatMoney(ptFinalTotal)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {ptCopySuccess && (
                <span className="rounded-md border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-100">
                  已复制 / Copied
                </span>
              )}
              <button
                onClick={handleCopyQuoteSummary}
                className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
              >
                复制项目摘要 / Copy Item Summary
              </button>
              <button
                onClick={handleDownloadQuotePdf}
                className="rounded-lg bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              >
                下载 PDF / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
