"use client";
/* cSpell:words supabase fullpay */

import { useState, useEffect } from "react";
import {
  Activity,
  CupSoda,
  UtensilsCrossed,
  CalendarDays,
  Gift,
  ChevronRight,
  Sparkles,
  ShoppingCart,
  Plus,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";
import { AuthLoginScreen } from "@/features/auth/AuthLoginScreen";
import { usePricingData } from "@/features/pricing/usePricingData";
import { usePtCalculatorState } from "@/features/pricing/usePtCalculatorState";
import { useCycleCalculatorState } from "@/features/pricing/useCycleCalculatorState";
import { usePricingPresentation } from "@/features/pricing/usePricingPresentation";
import { cycleCopy } from "@/lib/copy/cycleCopy";
import { usePwaInstallPrompt } from "@/features/app/usePwaInstallPrompt";
import { asNumber, formatMoney } from "@/lib/formatters/number";
import { printHtml } from "@/lib/export/print";
import { getPresetUnitAndQty } from "@/lib/pricing/calculate";
import { glass, solidButtonBase } from "@/lib/pricing/constants";
import tabCopy from "@/lib/tabCopy.json";
import { buildCycleSummaryText, buildPtSummaryText } from "@/lib/export/quoteBuilders";
import { buildCyclePdfHtml, buildPtPdfHtml } from "@/lib/export/pdfBuilders";
import { buildCartSummaryText } from "@/lib/cart/cartTextBuilder";
import { buildCartPdfHtml } from "@/lib/export/cartPdfBuilder";
import { PwaInstallHint } from "@/components/PwaInstallHint";
import { CyclePlanModal } from "@/components/modals/CyclePlanModal";
import { PtCalculatorModal } from "@/components/modals/PtCalculatorModal";
import { CartQuoteModal } from "@/components/modals/CartQuoteModal";
import { useCartState } from "@/features/cart/useCartState";
import type { CyclePlanRow, PricingCategory, PricingItem, PtPreset, PtRow } from "@/types/pricing";

type CategoryFilter = "all" | PricingCategory;

export default function Home() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedRechargeIndex, setSelectedRechargeIndex] = useState(1);
  const [selectedPromoTrigger, setSelectedPromoTrigger] = useState(
    tabCopy.pages.storedValue.copy.promotionHighlights[0]?.trigger ?? "",
  );
  const [activeLocale, setActiveLocale] = useState<"zh" | "en">(() => {
    if (typeof window === "undefined") return "zh";
    const saved = window.localStorage.getItem("oxygen-pricing-locale");
    return saved === "zh" || saved === "en" ? saved : "zh";
  });
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [addingItemKey, setAddingItemKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("oxygen-pricing-locale", activeLocale);
  }, [activeLocale]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-avatar-menu]")) return;
      setAvatarMenuOpen(false);
    }

    if (avatarMenuOpen) {
      document.addEventListener("mousedown", handleDocumentClick);
    }
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [avatarMenuOpen]);

  const categoryMeta = {
    membership: tabCopy.pages.membership.copy.sectionTitle,
    group_class: tabCopy.pages.membership.copy.groupClass.title,
    personal_training: tabCopy.pages.personalTraining.copy.title,
    assessment: tabCopy.pages.personalTraining.copy.assessment,
    cycle_plan: tabCopy.pages.cyclePlan.copy.title,
    stored_value: tabCopy.pages.storedValue.copy.title,
  };

  const promotionGroups = (() => {
    const groups = new Map<string, { label: { zh: string; en: string }; items: typeof tabCopy.pages.storedValue.copy.promotionHighlights }>();

    tabCopy.pages.storedValue.copy.promotionHighlights.forEach((promo) => {
      const groupKey = promo.group.en;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          label: promo.group,
          items: [],
        });
      }
      groups.get(groupKey)!.items.push(promo);
    });

    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
    }));
  })();

  const getCopy = (value?: { zh: string; en: string }) => (value ? value[activeLocale] : "");

  const {
    selectedPtRow,
    setSelectedPtRow,
    ptPreviewRow,
    setPtPreviewRow,
    ptUnitMember1v1,
    setPtUnitMember1v1,
    ptUnitNonMember1v1,
    setPtUnitNonMember1v1,
    ptUnitMember1v2,
    setPtUnitMember1v2,
    ptUnitNonMember1v2,
    setPtUnitNonMember1v2,
    ptQtyMember1v1,
    setPtQtyMember1v1,
    ptQtyNonMember1v1,
    setPtQtyNonMember1v1,
    ptQtyMember1v2,
    setPtQtyMember1v2,
    ptQtyNonMember1v2,
    setPtQtyNonMember1v2,
    ptPreset,
    setPtPreset,
    ptCredit,
    setPtCredit,
    ptCopySuccess,
    setPtCopySuccess,
    ptUnitInputEmpty,
    setPtUnitInputEmpty,
    ptQtyInputEmpty,
    setPtQtyInputEmpty,
    ptCreditInputEmpty,
    setPtCreditInputEmpty,
    ptClientName,
    setPtClientName,
    ptActiveLabel,
    ptActiveSubtotal,
    ptAfterCredit,
    ptTaxAfterAdjust,
    ptFinalTotal,
    ptReportDate,
  } = usePtCalculatorState();

  const {
    selectedCyclePlan,
    setSelectedCyclePlan,
    cyclePreviewPlan,
    setCyclePreviewPlan,
    cycleStep,
    setCycleStep,
    cycleSelectedPtProgram,
    setCycleSelectedPtProgram,
    cycleSelectedCourses,
    setCycleSelectedCourses,
    cycleClientName,
    setCycleClientName,
    cycleCopied,
    setCycleCopied,
    cyclePtPreset,
    setCyclePtPreset,
    cycleUnitMember1v1,
    setCycleUnitMember1v1,
    cycleUnitNonMember1v1,
    setCycleUnitNonMember1v1,
    cycleUnitMember1v2,
    setCycleUnitMember1v2,
    cycleUnitNonMember1v2,
    setCycleUnitNonMember1v2,
    cycleQtyMember1v1,
    setCycleQtyMember1v1,
    cycleUnitInputStr,
    setCycleUnitInputStr,
    cycleQtyInputStr,
    setCycleQtyInputStr,
    cycleQtyNonMember1v1,
    setCycleQtyNonMember1v1,
    cycleQtyMember1v2,
    setCycleQtyMember1v2,
    cycleQtyNonMember1v2,
    setCycleQtyNonMember1v2,
    cycleCredit,
    setCycleCredit,
    cycleCreditInputStr,
    setCycleCreditInputStr,
    cycleActiveLabel,
    cycleSubtotal,
    cycleAfterCredit,
    cycleTax,
    cycleTotal,
  } = useCycleCalculatorState();

  const {
    authState,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    profile,
    handleSignIn,
    handleSignOut,
  } = useAuth();

  const {
    items: cartItems,
    totals: cartTotals,
    customer: cartCustomer,
    isOpen: cartOpen,
    setIsOpen: setCartOpen,
    addItem: addCartItem,
    updateItem: updateCartItem,
    removeItem: removeCartItem,
    clearCart,
    updateCustomer: updateCartCustomer,
    lastAddedId,
    clearLastAdded,
  } = useCartState();

  const { pricingItems } = usePricingData(authState);

  const storedValuePlans = pricingItems
    .filter((item) => item.category === "stored_value")
    .map((item) => {
      const meta = (item.meta ?? {}) as Record<string, unknown>;
      const giftAmount = asNumber(meta.gift_amount) ?? 0;
      const giftTotalValue = asNumber(meta.gift_total_value) ?? 0;
      const giftMembershipZh = typeof meta.gift_membership === "string" ? meta.gift_membership : "-";
      const giftMembershipEn = typeof meta.gift_membership_en === "string" ? meta.gift_membership_en : "-";
      const amount = item.price ?? 0;
      const amountLabel = activeLocale === "zh"
        ? `储值卡 ${formatMoney(amount)}`
        : `Stored Value ${formatMoney(amount)}`;

      return {
        id: item.id,
        amount,
        amountLabel,
        membershipGift: { zh: giftMembershipZh, en: giftMembershipEn },
        bonusCredit: giftAmount,
        totalValue: giftTotalValue,
      };
    })
    .sort((a, b) => a.amount - b.amount);

  const rechargePlans = storedValuePlans;

  const { groupedSections, cyclePtProgramOptions, getGroupClassDays } = usePricingPresentation(
    pricingItems,
    categoryFilter,
  );
  const { deferredInstallPrompt, showInstallHint, handleInstallApp, handleDismissInstallHint } = usePwaInstallPrompt();

  const ptActivePresetValues = getPresetUnitAndQty(ptPreset, {
    member1v1Unit: ptUnitMember1v1,
    nonMember1v1Unit: ptUnitNonMember1v1,
    member1v2Unit: ptUnitMember1v2,
    nonMember1v2Unit: ptUnitNonMember1v2,
    member1v1Qty: ptQtyMember1v1,
    nonMember1v1Qty: ptQtyNonMember1v1,
    member1v2Qty: ptQtyMember1v2,
    nonMember1v2Qty: ptQtyNonMember1v2,
  });

  const cycleActivePresetValues = getPresetUnitAndQty(cyclePtPreset, {
    member1v1Unit: cycleUnitMember1v1,
    nonMember1v1Unit: cycleUnitNonMember1v1,
    member1v2Unit: cycleUnitMember1v2,
    nonMember1v2Unit: cycleUnitNonMember1v2,
    member1v1Qty: cycleQtyMember1v1,
    nonMember1v1Qty: cycleQtyNonMember1v1,
    member1v2Qty: cycleQtyMember1v2,
    nonMember1v2Qty: cycleQtyNonMember1v2,
  });


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

  function handlePtCardTap(row: PtRow) {
    if (ptPreviewRow?.key === row.key) {
      openPtCalculator(row);
      return;
    }
    setPtPreviewRow(row);
  }

  function handleAddPtToCart() {
    if (!selectedPtRow) return;
    const { unit, qty } = getPresetUnitAndQty(ptPreset, {
      member1v1Unit: ptUnitMember1v1,
      nonMember1v1Unit: ptUnitNonMember1v1,
      member1v2Unit: ptUnitMember1v2,
      nonMember1v2Unit: ptUnitNonMember1v2,
      member1v1Qty: ptQtyMember1v1,
      nonMember1v1Qty: ptQtyNonMember1v1,
      member1v2Qty: ptQtyMember1v2,
      nonMember1v2Qty: ptQtyNonMember1v2,
    });

    addCartItem({
      name: `${selectedPtRow.nameZh} · ${ptActiveLabel.zh}`,
      category: selectedPtRow.key.startsWith("assessment:") ? "assessment" : "personal_training",
      unitPrice: unit,
      quantity: qty,
      note: ptCredit > 0 ? `抵扣 ${formatMoney(ptCredit)}` : undefined,
    });
    setSelectedPtRow(null);
  }

  function closePtCalculator() {
    setSelectedPtRow(null);
  }


  async function handleCopyQuoteSummary() {
    if (!selectedPtRow) return;
    setPtCopySuccess(false);
    const { unit, qty } = getPresetUnitAndQty(ptPreset, {
      member1v1Unit: ptUnitMember1v1,
      nonMember1v1Unit: ptUnitNonMember1v1,
      member1v2Unit: ptUnitMember1v2,
      nonMember1v2Unit: ptUnitNonMember1v2,
      member1v1Qty: ptQtyMember1v1,
      nonMember1v1Qty: ptQtyNonMember1v1,
      member1v2Qty: ptQtyMember1v2,
      nonMember1v2Qty: ptQtyNonMember1v2,
    });

    const summary = buildPtSummaryText({
      reportDate: ptReportDate,
      clientName: ptClientName,
      courseNameZh: selectedPtRow.nameZh,
    
      courseNameEn: selectedPtRow.nameEn,
      activeLabel: ptActiveLabel,
      unit,
      qty,
      subtotal: ptActiveSubtotal,
      credit: ptCredit,
      afterCredit: ptAfterCredit,
      tax: ptTaxAfterAdjust,
      total: ptFinalTotal,
    });

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

    const { unit, qty } = getPresetUnitAndQty(ptPreset, {
      member1v1Unit: ptUnitMember1v1,
      nonMember1v1Unit: ptUnitNonMember1v1,
      member1v2Unit: ptUnitMember1v2,
      nonMember1v2Unit: ptUnitNonMember1v2,
      member1v1Qty: ptQtyMember1v1,
      nonMember1v1Qty: ptQtyNonMember1v1,
      member1v2Qty: ptQtyMember1v2,
      nonMember1v2Qty: ptQtyNonMember1v2,
    });

    const html = buildPtPdfHtml({
      courseNameZh: selectedPtRow.nameZh,
      courseNameEn: selectedPtRow.nameEn,
      reportDate: ptReportDate,
      clientName: ptClientName,
      activeLabel: ptActiveLabel[activeLocale],
      unit,
      qty,
      subtotal: ptActiveSubtotal,
      credit: ptCredit,
      afterCredit: ptAfterCredit,
      tax: ptTaxAfterAdjust,
      total: ptFinalTotal,
    });

    printHtml(html, { width: 980, height: 760, delayMs: 250 });
  }


  function openCyclePlanCalculator(row: CyclePlanRow) {
    setSelectedCyclePlan(row);
    setCycleStep(1);
    setCycleSelectedPtProgram(null);
    setCycleCredit(0);
    setCycleCreditInputStr("0");
  }

  function handleCyclePlanCardTap(row: CyclePlanRow) {
    if (cyclePreviewPlan?.program === row.program) {
      openCyclePlanCalculator(row);
      return;
    }
    setCyclePreviewPlan(row);
  }

  function selectCyclePtProgramAndContinue(row: PtRow) {
    setCycleSelectedPtProgram(row);

    setCycleUnitMember1v1(row.member1v1 ?? 0);
    setCycleUnitNonMember1v1(row.nonMember1v1 ?? 0);
    setCycleUnitMember1v2(row.member1v2 ?? 0);
    setCycleUnitNonMember1v2(row.nonMember1v2 ?? 0);

    setCycleQtyMember1v1(12);
    setCycleQtyNonMember1v1(12);
    setCycleQtyMember1v2(12);
    setCycleQtyNonMember1v2(12);

    setCyclePtPreset("member_1v1");
    setCycleUnitInputStr(String(row.member1v1 ?? 0));
    setCycleQtyInputStr("12");
    setCycleStep(2);
  }

  function closeCyclePlanCalculator() {
    setSelectedCyclePlan(null);
    setCycleStep(1);
    setCycleSelectedPtProgram(null);
    setCycleSelectedCourses([]);
  }

  function handleAddCycleToCart() {
    if (!selectedCyclePlan || !cycleSelectedPtProgram) return;
    const { unit, qty } = getPresetUnitAndQty(cyclePtPreset, {
      member1v1Unit: cycleUnitMember1v1,
      nonMember1v1Unit: cycleUnitNonMember1v1,
      member1v2Unit: cycleUnitMember1v2,
      nonMember1v2Unit: cycleUnitNonMember1v2,
      member1v1Qty: cycleQtyMember1v1,
      nonMember1v1Qty: cycleQtyNonMember1v1,
      member1v2Qty: cycleQtyMember1v2,
      nonMember1v2Qty: cycleQtyNonMember1v2,
    });

    const presetLabel = (preset: PtPreset) =>
      preset === "member_1v1"
        ? "会员1v1"
        : preset === "non_member_1v1"
          ? "非会员1v1"
          : preset === "member_1v2"
            ? "会员1v2"
            : "非会员1v2";

    addCartItem({
      name: `${selectedCyclePlan.programZh} · 混合课程 ${cycleSelectedCourses.length || 1} 项`,
      category: "cycle_plan",
      unitPrice: cycleSubtotal,
      quantity: 1,
      details:
        cycleSelectedCourses.length > 0
          ? cycleSelectedCourses.map(
              (course) => `${course.program.nameZh} · ${presetLabel(course.preset)} · ${course.qty}次 · ${formatMoney(course.unitPrice)}`,
            )
          : [`${cycleSelectedPtProgram.nameZh} · ${cycleActiveLabel.zh} · ${qty}次 · ${formatMoney(unit)}`],
    });
    setSelectedCyclePlan(null);
    setCycleStep(1);
    setCycleSelectedPtProgram(null);
  }

  async function handleCopyCycleSummary() {
    if (!selectedCyclePlan || !cycleSelectedPtProgram) return;
    const { unit, qty } = getPresetUnitAndQty(cyclePtPreset, {
      member1v1Unit: cycleUnitMember1v1,
      nonMember1v1Unit: cycleUnitNonMember1v1,
      member1v2Unit: cycleUnitMember1v2,
      nonMember1v2Unit: cycleUnitNonMember1v2,
      member1v1Qty: cycleQtyMember1v1,
      nonMember1v1Qty: cycleQtyNonMember1v1,
      member1v2Qty: cycleQtyMember1v2,
      nonMember1v2Qty: cycleQtyNonMember1v2,
    });

    const summary = buildCycleSummaryText({
      reportDate: ptReportDate,
      clientName: cycleClientName,
      cycleProgram: selectedCyclePlan.program,
      courseNameZh: cycleSelectedPtProgram.nameZh,
      courseNameEn: cycleSelectedPtProgram.nameEn,
      activeLabel: cycleActiveLabel,
      unit,
      qty,
      subtotal: cycleSubtotal,
      credit: cycleCredit,
      afterCredit: cycleAfterCredit,
      tax: cycleTax,
      total: cycleTotal,
      courses: cycleSelectedCourses,
    });

    await navigator.clipboard.writeText(summary);
    setCycleCopied(true);
    setTimeout(() => setCycleCopied(false), 2000);
  }

  function handleDownloadCyclePdf() {
    if (!selectedCyclePlan || !cycleSelectedPtProgram) return;
    const { unit: unitPrice, qty } = getPresetUnitAndQty(cyclePtPreset, {
      member1v1Unit: cycleUnitMember1v1,
      nonMember1v1Unit: cycleUnitNonMember1v1,
      member1v2Unit: cycleUnitMember1v2,
      nonMember1v2Unit: cycleUnitNonMember1v2,
      member1v1Qty: cycleQtyMember1v1,
      nonMember1v1Qty: cycleQtyNonMember1v1,
      member1v2Qty: cycleQtyMember1v2,
      nonMember1v2Qty: cycleQtyNonMember1v2,
    });
    const reportDate = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

    const html = buildCyclePdfHtml({
      program: selectedCyclePlan.program,
      reportDate,
      clientName: cycleClientName,
      activeLabel: cycleActiveLabel[activeLocale],
      courseNameZh: cycleSelectedPtProgram.nameZh,
      courseNameEn: cycleSelectedPtProgram.nameEn,
      weeklySessions: selectedCyclePlan.weeklySessions,
      minSessions: selectedCyclePlan.minSessions,
      wpdFollowups: selectedCyclePlan.wpdFollowups,
      assessmentsReports: selectedCyclePlan.assessmentsReports,
      membershipGift: selectedCyclePlan.membershipGift,
      extraBenefits: selectedCyclePlan.extraBenefits,
      unitPrice,
      qty,
      subtotal: cycleSubtotal,
      credit: cycleCredit,
      afterCredit: cycleAfterCredit,
      tax: cycleTax,
      total: cycleTotal,
      courses: cycleSelectedCourses,
    });

    printHtml(html, { width: 900, height: 700 });
  }

  type StandardRow = (typeof groupedSections.standardSections)[number]["rows"][number];
  type GroupClassRow = NonNullable<typeof groupedSections.groupClassRows>[number];
  type StoredValuePlan = (typeof storedValuePlans)[number];

  function runAddAnimation(key: string) {
    setAddingItemKey(key);
    window.setTimeout(() => setAddingItemKey((prev) => (prev === key ? null : prev)), 850);
  }

  function addCartMembership(row: StandardRow) {
    const price = row.generalPrice ?? row.memberPrice ?? row.nonMemberPrice ?? 0;
    addCartItem({
      name: row.nameZh,
      category: "membership",
      unitPrice: price,
    });
    runAddAnimation(`membership-${row.key}`);
  }

  function addCartGroupClass(row: GroupClassRow) {
    const price = row.generalPrice ?? row.memberPrice ?? row.nonMemberPrice ?? 0;
    addCartItem({
      name: row.nameZh,
      category: "group_class",
      unitPrice: price,
    });
    runAddAnimation(`group-${row.key}`);
  }

  function addCartStoredValue(plan: StoredValuePlan) {
    addCartItem({
      name: plan.amountLabel,
      category: "stored_value",
      unitPrice: plan.amount,
      note: plan.membershipGift.zh,
    });
    runAddAnimation(`stored-${plan.id}`);
  }

  async function handleCopyCartSummary() {
    const reportDate = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    const summary = buildCartSummaryText({
      reportDate,
      customer: cartCustomer,
      items: cartItems,
      totals: cartTotals,
    });

    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // ignore copy failures
    }
  }

  function handleDownloadCartPdf() {
    const reportDate = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    const html = buildCartPdfHtml({
      reportDate,
      customer: cartCustomer,
      items: cartItems,
      totals: cartTotals,
    });
    printHtml(html, { width: 980, height: 760, delayMs: 250 });
  }

  function applyPtPreset(preset: "member_1v1" | "non_member_1v1" | "member_1v2" | "non_member_1v2") {
    setPtPreset(preset);
    setPtQtyMember1v1(preset === "member_1v1" ? 12 : 0);
    setPtQtyNonMember1v1(preset === "non_member_1v1" ? 12 : 0);
    setPtQtyMember1v2(preset === "member_1v2" ? 12 : 0);
    setPtQtyNonMember1v2(preset === "non_member_1v2" ? 12 : 0);
  }


  if (authState === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authState === "guest") {
    return (
      <AuthLoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03050b] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,163,0.18),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.14),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:3px_3px] [background-image:radial-gradient(rgba(255,255,255,0.4)_0.4px,transparent_0.4px)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <header className={`${glass} p-4 md:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Oxygen<span className="text-emerald-300">Pricing</span>
              </h1>
              <p className="mt-1 text-xs text-slate-400">Sales Console · 深色科技风重构版</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveLocale((prev) => (prev === "zh" ? "en" : "zh"))}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Lang</span>
                  <span>{activeLocale === "zh" ? "中文" : "English"}</span>
                </button>
                <button
                  onClick={() => setCartOpen(true)}
                  className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-full border text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-500/25 ${
                    addingItemKey ? "border-cyan-200/70 bg-cyan-500/20" : "border-cyan-300/50 bg-cyan-500/15"
                  }`}
                  aria-label={`购物车，当前 ${cartTotals.itemsCount} 项`}
                  title="购物车"
                >
                  <ShoppingCart size={14} />
                  {cartTotals.itemsCount > 0 && (
                    <span className={`absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950 ${
                      addingItemKey ? "animate-[cart-flash_650ms_ease-in-out]" : ""
                    }`}>
                      {cartTotals.itemsCount}
                    </span>
                  )}
                </button>
                <div className="relative" data-avatar-menu>
                  <button
                    onClick={() => setAvatarMenuOpen((prev) => !prev)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/40"
                    aria-label={activeLocale === "zh" ? "用户菜单" : "User menu"}
                  >
                    {(profile?.full_name || profile?.email || email || "U")[0]?.toUpperCase()}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1424]/98 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 text-sm font-semibold text-cyan-100">
                          {(profile?.full_name || profile?.email || email || "U")[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {profile?.full_name || profile?.email || email || "-"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {profile?.role ?? (email?.toLowerCase() === "admin" ? "admin" : "sales")}
                          </p>
                        </div>
                      </div>
                
                      <div className="border-t border-white/10 px-4 py-3">
                        <button
                          onClick={handleSignOut}
                          className="w-full rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/20"
                        >
                          {activeLocale === "zh" ? "退出登录" : "Sign out"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </header>

        <PwaInstallHint
          visible={showInstallHint && Boolean(deferredInstallPrompt)}
          onInstall={handleInstallApp}
          onDismiss={handleDismissInstallHint}
        />

          <section className="mt-5 space-y-5">
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
              {(Object.keys(categoryMeta) as PricingItem["category"][])
                .filter((cat) => cat !== "assessment" && cat !== "group_class")
                .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`${solidButtonBase} text-sm ${
                    categoryFilter === cat
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "bg-slate-700/90 text-slate-100 hover:bg-slate-600/90"
                  }`}
                >
                  {getCopy(categoryMeta[cat])}
                </button>
              ))}
            </div>

            {groupedSections.standardSections.map(({ category, rows }) => (
              <article key={category} className={`${glass} p-4`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white md:text-xl">
                    {getCopy(categoryMeta[category])}
                  </h3>
                  <span className="inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-emerald-100">
                    PREMIUM ACCESS
                  </span>
                </div>

                <div className="space-y-2">
                  {(() => {
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
                  })().map((row, index) => {
                      const membershipPrice = row.generalPrice ?? row.nonMemberPrice ?? row.memberPrice;
                      const activeName = activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh;
                      const name = activeName.toLowerCase();

                      const cycleLabel =
                        name.includes("日") || name.includes("day")
                          ? getCopy(tabCopy.pages.membership.copy.cycleLabels.day)
                          : name.includes("周") || name.includes("week")
                            ? getCopy(tabCopy.pages.membership.copy.cycleLabels.week)
                            : name.includes("年") || name.includes("year") || name.includes("annual")
                              ? getCopy(tabCopy.pages.membership.copy.cycleLabels.year)
                              : name.includes("月") || name.includes("month") || name.includes("monthly")
                                ? getCopy(tabCopy.pages.membership.copy.cycleLabels.month)
                                : getCopy(tabCopy.pages.membership.copy.cycleLabels.membership);

                      const isMonthly = name.includes("月") || name.includes("month") || name.includes("monthly");
                      const isAnnual = name.includes("年") || name.includes("year") || name.includes("annual");

                      const coreAccessItems = tabCopy.pages.membership.copy.coreAccessItems.map((item) => getCopy(item));

                      const bonusItems = isAnnual
                        ? tabCopy.pages.membership.copy.bonusItems.annual
                        : isMonthly
                          ? tabCopy.pages.membership.copy.bonusItems.monthly
                          : [];

                      const activationFeeText = isAnnual
                        ? getCopy(tabCopy.pages.membership.copy.activationFeeCopy.annual)
                        : isMonthly
                          ? getCopy(tabCopy.pages.membership.copy.activationFeeCopy.monthly)
                          : getCopy(tabCopy.pages.membership.copy.activationFeeCopy.default);

                      return (
                        <article key={row.key} className="relative overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(135deg,rgba(8,15,30,0.92),rgba(6,24,34,0.85))] p-3 md:p-4">
                          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
                          <div className="grid gap-3 md:grid-cols-[1.05fr_0.9fr_2.05fr] md:items-start">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200/80">
                                {activeLocale === "zh" ? `方案 ${index + 1}` : `Plan ${index + 1}`}
                              </p>
                              <p className="mt-1 font-semibold text-white">
                                {index + 1}. {activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh}
                              </p>
                              <p className="mt-1 text-xs text-slate-300">
                                {activeLocale === "zh" ? "周期" : "Cycle"}: {cycleLabel}
                              </p>
                            </div>

                            <div className="rounded-xl px-3 py-2">
                              <p className="text-[10px] text-emerald-100/80">
                                {activeLocale === "zh" ? "会籍价格" : "Membership Price"}
                              </p>
                              <p className="font-semibold text-emerald-200">{formatMoney(membershipPrice ?? undefined)}</p>
                              <p className="mt-2 text-[10px] text-amber-100/80">
                                {activeLocale === "zh" ? "激活费" : "Activation Fee"}
                              </p>
                              <p className="text-xs text-amber-200">{activationFeeText}</p>
                            </div>

                            <div className="overflow-hidden rounded-md border border-white/10">
                              <div className="grid grid-cols-2 bg-white/[0.02] text-[10px] text-slate-500">
                                <div className="border-r border-white/10 px-2 py-1">
                                  {activeLocale === "zh" ? "核心权益" : "Core Access"}
                                </div>
                                <div className="px-2 py-1">
                                  {activeLocale === "zh" ? "加赠福利" : "Bonus"}
                                </div>
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
                                        const iconMap: Record<string, typeof CupSoda> = {
                                          "Drink Voucher": CupSoda,
                                          "Meal Voucher": UtensilsCrossed,
                                          "Weekly Pass": CalendarDays,
                                        };
                                        const Icon = iconMap[item.en] ?? Gift;
                                        return (
                                          <div
                                            key={item.en}
                                            className="relative overflow-hidden rounded-lg border border-amber-300/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 px-2 py-1.5"
                                          >
                                            <div className="absolute -right-4 -top-4 h-10 w-10 rounded-full bg-amber-300/10 blur-md" />
                                            <div className="flex items-start gap-2">
                                              <div className="mt-0.5 rounded-md border border-amber-200/25 bg-amber-400/10 p-1 text-amber-200">
                                                <Icon size={12} />
                                              </div>
                                              <div className="leading-tight">
                                                <p className="text-[11px] font-semibold text-amber-100">
                                                  {getCopy(item)} ×{item.qty}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">
                                      {getCopy(tabCopy.pages.membership.copy.bonusItems.none)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => addCartMembership(row)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                addingItemKey === `membership-${row.key}`
                                  ? "border-emerald-200/70 bg-emerald-500/30 text-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.45)]"
                                  : "border-emerald-300/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-200/70 hover:bg-emerald-500/25"
                              }`}
                              aria-label="加入报价"
                              title="加入报价"
                            >
                              <Plus size={12} />
                              <span>{activeLocale === "zh" ? "加入报价" : "Add"}</span>
                            </button>
                          </div>
                        </article>
                      );

                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(8,47,73,0.3))] p-4 md:p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-cyan-100 md:text-base">
                      {getCopy(tabCopy.pages.membership.copy.newSignupTitle)}
                    </h4>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-100">
                      {getCopy(tabCopy.pages.membership.copy.newSignupBadge)}
                    </span>
                  </div>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-100">
                    {tabCopy.pages.membership.copy.newSignupBenefits.map((benefit) => (
                      <li key={benefit.en}>{getCopy(benefit)}</li>
                    ))}
                  </ul>
                </div>

                {groupedSections.groupClassRows && (
                  <div className="mt-5 rounded-2xl border border-white/12 bg-[#0a1628]/70 p-3 md:p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-base font-semibold text-white">{getCopy(tabCopy.pages.membership.copy.groupClass.title)}</h4>
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-100">
                        {getCopy(tabCopy.pages.membership.copy.groupClass.badge)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {groupedSections.groupClassRows.map((row, index) => {
                        const groupClassDays = getGroupClassDays(row.modeKey);
                        const memberPerDay =
                          groupClassDays && typeof row.memberPrice === "number" ? row.memberPrice / groupClassDays : null;
                        const nonMemberPerDay =
                          groupClassDays && typeof row.nonMemberPrice === "number" ? row.nonMemberPrice / groupClassDays : null;
                        const displayName = activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh;
                        const modeLabel = row.modeKey === "weekly_pass"
                          ? activeLocale === "zh" ? "周通" : "Weekly"
                          : row.modeKey === "monthly_pass"
                            ? activeLocale === "zh" ? "月通" : "Monthly"
                            : row.modeKey === "single"
                              ? activeLocale === "zh" ? "单次" : "Single"
                              : row.modeKey ?? "-";
                        const durationLabel = groupClassDays
                          ? activeLocale === "zh"
                            ? `${groupClassDays} 天`
                            : `${groupClassDays} days`
                          : "-";

                        return (
                          <article key={row.key} className="py-1.5">
                            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/12 bg-[linear-gradient(135deg,rgba(9,19,35,0.92),rgba(7,28,45,0.8))] text-xs md:grid-cols-6 md:text-sm">
                              <div className="col-span-2 border-b border-white/10 px-3 py-2 md:col-span-2 md:border-b-0 md:border-r">
                                <p className="font-semibold text-white">{index + 1}. {displayName}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  {activeLocale === "zh" ? "模式" : "Mode"}: {modeLabel}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {activeLocale === "zh" ? "周期" : "Duration"}: {durationLabel}
                                </p>
                              </div>

                              <div className="border-b border-r border-white/10 px-3 py-2 md:border-b-0">
                                <p className="text-[10px] text-slate-500">{getCopy(tabCopy.pages.membership.copy.groupClass.columns.member)}</p>
                                <p className="font-semibold text-emerald-200">{formatMoney(row.memberPrice)}</p>
                              </div>

                              <div className="border-b border-white/10 px-3 py-2 md:border-b-0 md:border-r">
                                <p className="text-[10px] text-slate-500">{getCopy(tabCopy.pages.membership.copy.groupClass.columns.nonMember)}</p>
                                <p className="font-semibold text-amber-200">{formatMoney(row.nonMemberPrice)}</p>
                              </div>

                              <div className="border-r border-white/10 px-3 py-2">
                                <p className="text-[10px] text-slate-500">{getCopy(tabCopy.pages.membership.copy.groupClass.columns.memberPerDay)}</p>
                                <p className="text-cyan-200">{memberPerDay !== null ? `$${memberPerDay.toFixed(2)}` : "-"}</p>
                              </div>

                              <div className="px-3 py-2">
                                <p className="text-[10px] text-slate-500">{getCopy(tabCopy.pages.membership.copy.groupClass.columns.nonMemberPerDay)}</p>
                                <p className="text-cyan-100">{nonMemberPerDay !== null ? `$${nonMemberPerDay.toFixed(2)}` : "-"}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => addCartGroupClass(row)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                  addingItemKey === `group-${row.key}`
                                    ? "border-emerald-200/70 bg-emerald-500/30 text-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.45)]"
                                    : "border-emerald-300/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-200/70 hover:bg-emerald-500/25"
                                }`}
                                aria-label="加入报价"
                                title="加入报价"
                              >
                                <Plus size={12} />
                                <span>{activeLocale === "zh" ? "加入报价" : "Add"}</span>
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            ))}

            {(categoryFilter === "all" || categoryFilter === "stored_value") && (
              <article className={`${glass} relative overflow-hidden p-4 md:p-6`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(56,189,248,0.16),transparent_35%)]" />

                <div className="relative overflow-hidden rounded-3xl border border-cyan-300/25 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_85%_25%,rgba(16,185,129,0.2),transparent_36%),linear-gradient(140deg,#040a16_10%,#071225_42%,#051426_100%)] p-4 md:p-6">
                  <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 right-8 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

                  <div className="relative mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-cyan-100">
                        <Sparkles size={13} /> {getCopy(tabCopy.pages.storedValue.copy.title).toUpperCase()}
                      </p>
                      <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                        {getCopy(tabCopy.pages.storedValue.copy.title)}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">
                        {getCopy(tabCopy.pages.storedValue.copy.activePromotions)}
                      </p>
                      <p className="text-lg font-bold text-emerald-100">
                        {promotionGroups.flatMap((g) => g.items).length} {activeLocale === "zh" ? "项" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="relative grid gap-4 xl:grid-cols-[1.25fr_1fr]">
                    <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-cyan-100">{getCopy(tabCopy.pages.storedValue.copy.promoTitle)}</h4>
                        <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">
                          {getCopy(tabCopy.pages.storedValue.copy.promoBadge)}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {promotionGroups.flatMap((group) => group.items).map((promo, index) => {
                          const isSelected = selectedPromoTrigger === promo.trigger;
                          return (
                            <button
                              type="button"
                              key={`${promo.trigger}-${index}`}
                              onClick={() => setSelectedPromoTrigger(promo.trigger)}
                              className={`group w-full rounded-xl border p-3 text-left transition-all duration-300 active:scale-[0.985] ${
                                isSelected
                                  ? "border-cyan-300/70 bg-gradient-to-br from-cyan-400/25 via-cyan-500/16 to-emerald-500/12 shadow-[0_0_0_1px_rgba(34,211,238,0.32),0_0_26px_rgba(34,211,238,0.22)]"
                                  : "border-white/10 bg-[#0a1424]/70"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span
                                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                                    isSelected ? "bg-cyan-200 text-[#041320]" : "bg-slate-700 text-slate-200"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-100">
                                    {getCopy(promo.title)}
                                  </p>
                                  <p className="mt-1 text-[11px] leading-5 text-slate-300">
                                    {getCopy(promo.detail)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {rechargePlans.map((plan, index) => {
                        const isMidTier = index === 1;
                        const isTopTier = index === rechargePlans.length - 1;
                        const isSelected = selectedRechargeIndex === index;

                        return (
                          <div
                            role="button"
                            tabIndex={0}
                            key={`${plan.id}-gift`}
                            onClick={() => setSelectedRechargeIndex(index)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedRechargeIndex(index);
                              }
                            }}
                            className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 active:scale-[0.985] ${
                              isSelected
                                ? "border-cyan-300/65 bg-gradient-to-br from-cyan-500/16 via-sky-500/10 to-emerald-500/10 shadow-[0_0_0_1px_rgba(125,211,252,0.26),0_0_22px_rgba(34,211,238,0.14)]"
                                : "border-white/12 bg-[#081120]/88"
                            }`}
                          >
                            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.1),transparent)]`} />

                            <div className="relative mb-2 flex items-center justify-between">
                              <span className="text-base font-extrabold tracking-wide text-white md:text-lg">
                                {plan.amountLabel}
                              </span>
                              <Gift size={14} className={isSelected ? "text-cyan-100" : "text-emerald-200"} />
                            </div>

                            <div className="relative flex items-end justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{getCopy(plan.membershipGift)}</p>
                              </div>
                              <ChevronRight size={16} className={`text-slate-300 transition-transform ${isSelected ? "translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                            </div>

                            <p className="relative mt-2 text-xs text-cyan-100">
                              {getCopy(tabCopy.pages.storedValue.copy.labels.bonusCredit)}: <span className="font-bold">{formatMoney(plan.bonusCredit)}</span>
                            </p>

                            <p className="relative mt-1 text-xs text-emerald-100/90">
                              {getCopy(tabCopy.pages.storedValue.copy.labels.giftValue)}: <span className="font-semibold">{formatMoney(plan.totalValue)}</span>
                            </p>

                            <div className="relative mt-3 flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  addCartStoredValue(plan);
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                  addingItemKey === `stored-${plan.id}`
                                    ? "border-emerald-200/70 bg-emerald-500/30 text-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.45)]"
                                    : "border-emerald-300/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-200/70 hover:bg-emerald-500/25"
                                }`}
                                aria-label="加入报价"
                                title="加入报价"
                              >
                                <Plus size={12} />
                                <span>{activeLocale === "zh" ? "加入报价" : "Add"}</span>
                              </button>

                              {isMidTier && (
                                <span className="inline-flex rounded-md border border-cyan-300/45 bg-cyan-500/20 px-2 py-1 text-[11px] font-semibold text-cyan-50">
                                  {getCopy(tabCopy.pages.storedValue.copy.badges.mostPopular)}
                                </span>
                              )}

                              {isTopTier && (
                                <span className="inline-flex rounded-md border border-emerald-300/40 bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-50">
                                  {getCopy(tabCopy.pages.storedValue.copy.badges.bestValue)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  </div>
                </div>
              </article>
             
            )}

            {groupedSections.ptSection && (
              <article className={`${glass} p-4`}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{getCopy(tabCopy.pages.personalTraining.copy.title)}</h3>

                  </div>
                </div>

                <div className="space-y-3">
                  {groupedSections.ptSection.rows.map((row, index) => {
                    const isAssessmentItem = row.key.startsWith("assessment:");
                    const isFirstAssessment =
                      isAssessmentItem &&
                      (index === 0 || !groupedSections.ptSection!.rows[index - 1].key.startsWith("assessment:"));
                    const ProgramIcon = Activity;
                    const isSelected = ptPreviewRow?.key === row.key;
                    const rowNameEn = row.nameEn;
                    const displayName = activeLocale === "zh" ? row.nameZh : rowNameEn ?? row.nameZh;
                    const focusText = isAssessmentItem
                      ? activeLocale === "zh"
                        ? row.focusZh
                        : row.focusEn
                      : activeLocale === "zh"
                        ? row.focusZh ?? "-"
                        : row.focusEn ?? "-";
                    const idealForText = isAssessmentItem
                      ? activeLocale === "zh"
                        ? row.idealForZh
                        : row.idealForEn
                      : activeLocale === "zh"
                        ? row.idealForZh ?? "-"
                        : row.idealForEn ?? "-";

                    return (
                      <div key={row.key}>
                        {isFirstAssessment && (
                          <div className="mb-2 mt-2 rounded-xl px-3 py-2">
                            <p className="text-sm font-semibold text-white">{getCopy(tabCopy.pages.personalTraining.copy.assessment)}</p>
                          </div>
                        )}
                        <article
                          onClick={() => {
                            if (isAssessmentItem) {
                              setPtPreviewRow(row);
                              return;
                            }
                            handlePtCardTap(row);
                          }}
                          className={`group relative overflow-hidden rounded-xl border bg-black px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all duration-500 ${
                            isAssessmentItem ? "" : "active:scale-[0.992]"
                          } ${
                            isSelected
                              ? "border-emerald-300/70 shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_0_34px_rgba(16,185,129,0.28)]"
                              : "border-white/10 hover:border-emerald-300/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.22)]"
                          } ${isAssessmentItem ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className={`pointer-events-none absolute inset-0 rounded-xl border transition-all duration-500 ${isSelected ? "border-emerald-300/55 opacity-100" : "border-emerald-300/0 opacity-0 group-hover:border-emerald-300/35 group-hover:opacity-100"}`} />
                          <div className={`pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-400/0 via-emerald-300/20 to-cyan-300/0 blur-md transition-opacity duration-500 ${isSelected ? "opacity-100 animate-[pulse_2.8s_ease-in-out_infinite]" : "opacity-0 group-hover:opacity-100 group-hover:animate-[pulse_2.8s_ease-in-out_infinite]"}`} />

                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex items-center gap-2">
                                {isSelected && (
                                  <span className="inline-flex h-5 w-5 items-center justify-center">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-200 shadow-[0_0_10px_rgba(167,243,208,0.95)] animate-[pulse_1.6s_ease-in-out_infinite]" />
                                  </span>
                                )}
                                <div className="rounded-md border border-emerald-300/30 bg-emerald-500/10 p-1.5">
                                  <ProgramIcon size={14} className="text-emerald-200" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-white">
                                    {index + 1}. {displayName}
                                  </p>
                                  {row.key.startsWith("assessment:") && (
                                    <span className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-100">
                                      {getCopy(tabCopy.pages.personalTraining.copy.assessment)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {(focusText || idealForText) && (
                            <div className="grid gap-3 md:grid-cols-2">
                              {focusText && (
                                <div className="text-xs">
                                  <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.trainingFocus)}</p>
                                  <p className="mt-1 text-slate-300">{focusText}</p>
                                </div>
                              )}
                              {idealForText && (
                                <div className="text-xs">
                                  <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.idealFor)}</p>
                                  <p className="mt-1 text-slate-300">{idealForText}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                            <div className="border-l-2 border-emerald-300/40 pl-2">
                              <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.pricing.label1v1)}</p>
                              <p className="text-slate-300">
                                {getCopy(tabCopy.pages.personalTraining.copy.pricing.member)}: <span className="font-semibold text-emerald-200">{formatMoney(row.member1v1)}</span>
                              </p>
                              <p className="text-slate-300">
                                {getCopy(tabCopy.pages.personalTraining.copy.pricing.nonMember)}: <span className="font-semibold text-amber-200">{formatMoney(row.nonMember1v1)}</span>
                              </p>
                            </div>
                            <div className="border-l-2 border-cyan-300/40 pl-2">
                              <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.pricing.label1v2)}</p>
                              <p className="text-slate-300">
                                {getCopy(tabCopy.pages.personalTraining.copy.pricing.member)}: <span className="font-semibold text-emerald-200">{formatMoney(row.member1v2)}</span>
                              </p>
                              <p className="text-slate-300">
                                {getCopy(tabCopy.pages.personalTraining.copy.pricing.nonMember)}: <span className="font-semibold text-amber-200">{formatMoney(row.nonMember1v2)}</span>
                              </p>
                            </div>
                          </div>

                        </article>
                      </div>
                    );
                  })}
                </div>
              </article>
            )}

            {groupedSections.cyclePlanRows && (
              <article className={`${glass} overflow-hidden p-4 md:p-5`}>
                <div className="mb-5 flex items-center justify-between gap-2">
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {getCopy(tabCopy.pages.cyclePlan.copy.title)}
                  </h3>
                  <p className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-100">
                    {getCopy(tabCopy.pages.cyclePlan.copy.badge)}
                  </p>
                </div>

                <div className="space-y-3">
                  {groupedSections.cyclePlanRows.map((row, idx) => (
                    <div key={row.program} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleCyclePlanCardTap(row)}
                        className={`group relative w-full overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,#080f1d_0%,#0b1630_56%,#10142a_100%)] p-4 text-left transition-all duration-300 active:scale-[0.995] ${
                          cyclePreviewPlan?.program === row.program
                            ? "border-violet-300/55 shadow-[0_0_28px_rgba(167,139,250,0.2)]"
                            : "border-white/12 hover:border-violet-300/45 hover:shadow-[0_0_28px_rgba(167,139,250,0.18)]"
                        }`}
                      >
                        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 bg-[radial-gradient(circle_at_85%_18%,rgba(167,139,250,0.2),transparent_35%)] ${cyclePreviewPlan?.program === row.program ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />

                        <div className="relative grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {cyclePreviewPlan?.program === row.program && (
                                <span className="inline-flex h-5 w-5 items-center justify-center">
                                  <span className="h-2.5 w-2.5 rounded-full bg-violet-200 shadow-[0_0_12px_rgba(196,181,253,0.95)] animate-[pulse_1.5s_ease-in-out_infinite]" />
                                </span>
                              )}
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/35 bg-violet-500/15 text-sm font-bold text-violet-100">
                                {idx + 1}
                              </div>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.12em] text-violet-200/80">
                                {activeLocale === "zh" ? "周期方案" : "Cycle Program"}
                              </p>
                              <p className="mt-0.5 text-[17px] font-semibold text-white">
                                {activeLocale === "zh" ? row.programZh : row.programEn ?? row.programZh}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                              <p className="text-[10px] leading-tight text-slate-400">
                                {cycleCopy[activeLocale].weeklySessions}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-cyan-100">{row.weeklySessions}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                              <p className="text-[10px] leading-tight text-slate-400">
                                {cycleCopy[activeLocale].minSessions}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-cyan-100">{row.minSessions}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                              <p className="text-[10px] leading-tight text-slate-400">
                                {cycleCopy[activeLocale].followups}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-cyan-100">{row.wpdFollowups}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                              <p className="text-[10px] leading-tight text-slate-400">
                                {cycleCopy[activeLocale].assessments}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-cyan-100">{row.assessmentsReports}</p>
                            </div>
                          </div>

                          <div className="space-y-2 lg:text-right">
                            <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2">
                              <p className="text-[10px] leading-tight text-emerald-100/80">
                                {cycleCopy[activeLocale].membershipGift}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-emerald-50">
                                {activeLocale === "zh" ? row.membershipGiftZh : row.membershipGiftEn}
                              </p>
                            </div>
                            <p className="text-xs text-violet-100/90">
                              {cycleCopy[activeLocale].extraBenefits}: 
                              <span className="font-medium text-violet-50">
                                {activeLocale === "zh" ? row.extraBenefitsZh : row.extraBenefitsEn}
                              </span>
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-violet-300/25 bg-violet-500/10 p-4">
                  <h4 className="text-sm font-semibold text-violet-100">
                    {activeLocale === "zh" ? "课程福利" : "Program Benefits"}
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                    {tabCopy.pages.cyclePlan.copy.programBenefits.map((benefit) => (
                      <li key={benefit.en}>{getCopy(benefit)}</li>
                    ))}
                  </ul>
                </div>
              </article>
            )}
          </section>

      <PtCalculatorModal
        selectedPtRow={selectedPtRow}
        activeLocale={activeLocale}
        ptPreset={ptPreset}
        ptUnitInputEmpty={ptUnitInputEmpty}
        ptQtyInputEmpty={ptQtyInputEmpty}
        ptCreditInputEmpty={ptCreditInputEmpty}
        ptUnitMember1v1={ptUnitMember1v1}
        ptUnitNonMember1v1={ptUnitNonMember1v1}
        ptUnitMember1v2={ptUnitMember1v2}
        ptUnitNonMember1v2={ptUnitNonMember1v2}
        ptQtyMember1v1={ptQtyMember1v1}
        ptQtyNonMember1v1={ptQtyNonMember1v1}
        ptQtyMember1v2={ptQtyMember1v2}
        ptQtyNonMember1v2={ptQtyNonMember1v2}
        ptActiveLabel={ptActiveLabel}
        ptActivePresetUnit={ptActivePresetValues.unit}
        ptActivePresetQty={ptActivePresetValues.qty}
        ptActiveSubtotal={ptActiveSubtotal}
        ptCredit={ptCredit}
        ptAfterCredit={ptAfterCredit}
        ptTaxAfterAdjust={ptTaxAfterAdjust}
        ptFinalTotal={ptFinalTotal}
        ptReportDate={ptReportDate}
        ptClientName={ptClientName}
        onSetPtClientName={setPtClientName}
        ptCopySuccess={ptCopySuccess}
        onClose={closePtCalculator}
        onApplyPreset={applyPtPreset}
        onSetPtUnitInputEmpty={setPtUnitInputEmpty}
        onSetPtQtyInputEmpty={setPtQtyInputEmpty}
        onSetPtCreditInputEmpty={setPtCreditInputEmpty}
        onSetPtUnitMember1v1={setPtUnitMember1v1}
        onSetPtUnitNonMember1v1={setPtUnitNonMember1v1}
        onSetPtUnitMember1v2={setPtUnitMember1v2}
        onSetPtUnitNonMember1v2={setPtUnitNonMember1v2}
        onSetPtQtyMember1v1={setPtQtyMember1v1}
        onSetPtQtyNonMember1v1={setPtQtyNonMember1v1}
        onSetPtQtyMember1v2={setPtQtyMember1v2}
        onSetPtQtyNonMember1v2={setPtQtyNonMember1v2}
        onSetPtCredit={setPtCredit}
        onCopySummary={handleCopyQuoteSummary}
        onDownloadPdf={handleDownloadQuotePdf}
        onAddToCart={handleAddPtToCart}
      />

      <CyclePlanModal
        selectedCyclePlan={selectedCyclePlan}
        activeLocale={activeLocale}
        cycleStep={cycleStep}
        cyclePtProgramOptions={cyclePtProgramOptions}
        cycleSelectedPtProgram={cycleSelectedPtProgram}
        cycleSelectedCourses={cycleSelectedCourses}
        cycleClientName={cycleClientName}
        onSetCycleSelectedCourses={setCycleSelectedCourses}
        cycleCreditInputStr={cycleCreditInputStr}
        cycleCredit={cycleCredit}
        cycleSubtotal={cycleSubtotal}
        cycleAfterCredit={cycleAfterCredit}
        cycleTax={cycleTax}
        cycleTotal={cycleTotal}
        cycleCopied={cycleCopied}
        cycleActivePresetUnit={cycleActivePresetValues.unit}
        cycleActivePresetQty={cycleActivePresetValues.qty}
        onClose={closeCyclePlanCalculator}
        onSetCycleStep={setCycleStep}
        onSelectProgramAndContinue={selectCyclePtProgramAndContinue}
        onSetCycleClientName={setCycleClientName}
        onSetCycleCreditInputStr={setCycleCreditInputStr}
        onSetCycleCredit={setCycleCredit}
        onCopySummary={handleCopyCycleSummary}
        onDownloadPdf={handleDownloadCyclePdf}
        onAddToCart={handleAddCycleToCart}
      />

      <CartQuoteModal
        open={cartOpen}
        items={cartItems}
        totals={cartTotals}
        customer={cartCustomer}
        onClose={() => setCartOpen(false)}
        onRemoveItem={removeCartItem}
        onUpdateItem={updateCartItem}
        onUpdateCustomer={updateCartCustomer}
        onClearCart={clearCart}
        onCopySummary={handleCopyCartSummary}
        onDownloadPdf={handleDownloadCartPdf}
        lastAddedId={lastAddedId}
        onAnimationComplete={clearLastAdded}
      />
      </div>
    </div>
  );
}
