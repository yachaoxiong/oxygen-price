/* cSpell:words periodized */

import {
  Activity,
  Apple,
  Baby,
  Dumbbell,
  Flame,
  HeartPulse,
  Shield,
  Target,
  type LucideIcon,
  UserCheck,
} from "lucide-react";

import type { PricingCategory } from "@/types/pricing";

export const categoryMeta: Record<PricingCategory, { en: string; zh: string }> = {
  membership: { en: "Membership & Group Classes", zh: "会员&团课" },
  group_class: { en: "Group Classes", zh: "团体课程" },
  personal_training: { en: "Personal Training", zh: "私教课程" },
  assessment: { en: "Assessments", zh: "专项评估" },
  cycle_plan: { en: "Program Cycles", zh: "周期计划" },
  stored_value: { en: "Stored Value", zh: "储值计划" },
};

export const promotionHighlights = [
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
] as const;

export const newSignupBenefits = [
  "首月包括一次一对一专属身体评估 / 1 Professional Personal Wellness Consultation by Program Director",
  "一份专属训练计划 / 1 Month Wellness Training Program by Program Director",
  "一次营养评估及饮食计划设计 / 1 Personal Nutrition Assessment and Planning",
  "一次团课体验 / 1 Group Training Session",
] as const;

export const programBenefits = [
  "Program validity includes 2 bonus weeks./课程有效期包含额外2周赠送时间。",
  "If sessions are not completed within the validity period, 50% of remaining value can be used as renewal credit./如在有效期内未完成课程，剩余价值的50%可用于续费抵扣。",
  "Professional assessment, progress tracking, and personalized adjustments included./包含专业评估、进度跟踪及个性化训练调整。",
] as const;

export const personalTrainingProgramInfo: Record<string, { focus: string; idealFor: string; icon: LucideIcon }> = {
  基础力量训练: {
    focus: "Build strength, stability, and movement foundation / 建立力量、稳定性与动作基础",
    idealFor: "Beginners / Long-term inactive clients / 新手与久未运动人群",
    icon: Dumbbell,
  },
  体型重塑: {
    focus: "Fat loss with muscle maintenance and body shaping / 减脂塑形并维持肌肉",
    idealFor: "Weight loss / Body shaping goals / 想瘦、改体型、增肌或减脂",
    icon: Flame,
  },
  拳击体能: {
    focus: "Improve cardio and release stress / 提升心肺功能并释放压力",
    idealFor: "High stress / Boxing lovers / 压力大或喜欢对抗训练人群",
    icon: Target,
  },
  体态矫正: {
    focus: "Correct muscle imbalance and posture alignment / 改善体态与肌肉失衡",
    idealFor: "Rounded shoulders / Pelvic issues / 圆肩、骨盆问题人群",
    icon: Shield,
  },
  功能训练: {
    focus: "Improve daily movement quality and mobility / 提升日常动作效率与灵活度",
    idealFor: "Sedentary / Limited mobility / 久坐与活动受限人群",
    icon: Activity,
  },
  疼痛管理: {
    focus: "Reduce chronic pain and prevent injury / 缓解慢性不适并预防运动损伤",
    idealFor: "Shoulder / Back / Knee pain / 肩腰膝疼痛人群",
    icon: HeartPulse,
  },
  孕期产后: {
    focus: "Safe training for pregnancy and recovery / 孕期安全训练与产后恢复",
    idealFor: "Pregnancy / Postpartum clients / 怀孕与产后人群",
    icon: Baby,
  },
  饮食评估和饮食计划设计: {
    focus: "Personal nutrition assessment and planning / 饮食评估与饮食计划设计",
    idealFor: "Diet optimization / Body goal support / 饮食优化与体型目标人群",
    icon: Apple,
  },
  专业身体评估与周期计划: {
    focus: "Professional wellness consultation and periodized plan / 专业身体评估与周期计划制定",
    idealFor: "New members / Long-term goal clients / 新会员与长期目标客户",
    icon: UserCheck,
  },
};

export const rechargePlans = [
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
] as const;

export const glass = "rounded-2xl";

export const solidButtonBase =
  "rounded-[10px] border border-white/12 px-3 py-1.5 font-medium transition-all duration-200 text-slate-300 bg-[#121824]/90 hover:border-white/25 hover:bg-[#1a2233]/95";
