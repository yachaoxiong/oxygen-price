"use client";
/* cSpell:words supabase fullpay */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Activity, CalendarDays, CupSoda, Gift, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { AuthLoginScreen } from "@/features/auth/AuthLoginScreen";
import { usePricingData } from "@/features/pricing/usePricingData";
import { usePtCalculatorState } from "@/features/pricing/usePtCalculatorState";
import { useCycleCalculatorState } from "@/features/pricing/useCycleCalculatorState";
import { usePricingPresentation } from "@/features/pricing/usePricingPresentation";
import { cycleCopy } from "@/lib/copy/cycleCopy";
import { usePwaInstallPrompt } from "@/features/app/usePwaInstallPrompt";
import { asNumber, formatMoney } from "@/lib/formatters/number";
import { printHtml } from "@/lib/export/print";
import { glass } from "@/lib/pricing/constants";
import tabCopy from "@/lib/tabCopy.json";
import { buildPtSummaryText } from "@/lib/export/quoteBuilders";
import { buildPtPdfHtml } from "@/lib/export/pdfBuilders";
import { buildCartSummaryText } from "@/lib/cart/cartTextBuilder";
import { buildCartPdfHtml } from "@/lib/export/cartPdfBuilder";
import { cartCopy } from "@/lib/cart/cartCopy";
import { PwaInstallHint } from "@/components/PwaInstallHint";
import { Navbar } from "@/components/navigation/Navbar";
import { CyclePlanModal } from "@/components/modals/CyclePlanModal";
import { PtCalculatorModal } from "@/components/modals/PtCalculatorModal";
import { CartQuoteModal } from "@/components/modals/CartQuoteModal";
import { LoadingStitch } from "@/components/ui/LoadingStitch";
import { MessageToast } from "@/components/ui/MessageToast";
import { useCartState } from "@/features/cart/useCartState";
import type { CyclePlanRow, PricingCategory, PtPreset, PtRow } from "@/types/pricing";

type CategoryFilter = PricingCategory;

export type PricingSection = PricingCategory;

export function PricingShell({ section }: { section: PricingSection }) {
  return (
    <Suspense fallback={<LoadingStitch />}>
      <PricingShellContent section={section} />
    </Suspense>
  );
}

function PricingShellContent({ section }: { section: PricingSection }) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(section);
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
  const [messageToast, setMessageToast] = useState<{ title: string; subtitle?: string } | null>(null);
  const [refreshPull, setRefreshPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (categoryFilter === "stored_value") {
      body.classList.add("stored-value-mode");
    } else {
      body.classList.remove("stored-value-mode");
    }

    return () => body.classList.remove("stored-value-mode");
  }, [categoryFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("oxygen-pricing-locale", activeLocale);
  }, [activeLocale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshing || document.body.hasAttribute("data-modal-open")) return;
      pullStartY.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (pullStartY.current === null || refreshing || document.body.hasAttribute("data-modal-open")) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, currentY - pullStartY.current);
      if (delta === 0) return;
      event.preventDefault();
      const eased = Math.min(120, delta * 0.45);
      setRefreshPull(eased);
    };

    const handleTouchEnd = () => {
      if (pullStartY.current === null) return;
      if (refreshPull > 60 && !refreshing && !document.body.hasAttribute("data-modal-open")) {
        setRefreshing(true);
        setRefreshPull(70);
        window.location.reload();
      } else {
        setRefreshPull(0);
      }
      pullStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [refreshing, refreshPull]);

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

  const promotionGroups = useMemo(() => {
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
  }, []);

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
    ptActivePresetUnit,
    ptActivePresetQty,
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
    cycleActivePresetUnit,
    cycleActivePresetQty,
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
    creditApplied: cartCreditApplied,
    setCreditApplied: setCartCreditApplied,
    addItem: addCartItem,
    updateItem: updateCartItem,
    removeItem: removeCartItem,
    clearCart,
    updateCustomer: updateCartCustomer,
    lastAddedId,
    clearLastAdded,
  } = useCartState();

  const isAnyModalOpen = Boolean(selectedPtRow || selectedCyclePlan || cartOpen);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;

    if (isAnyModalOpen) {
      body.setAttribute("data-modal-open", "true");
      const previousOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = previousOverflow;
        body.removeAttribute("data-modal-open");
      };
    }

    body.style.overflow = "";
    body.removeAttribute("data-modal-open");
  }, [isAnyModalOpen]);

  const { pricingItems } = usePricingData(authState);
  const refreshHint = activeLocale === "zh" ? "下拉即可刷新" : "Pull to refresh";
  const refreshLabel = refreshing
    ? activeLocale === "zh" ? "刷新中..." : "Refreshing..."
    : refreshPull > 12
      ? activeLocale === "zh" ? "松开刷新" : "Release to refresh"
      : refreshHint;

  const storedValuePlans = useMemo(
    () =>
      pricingItems
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
        .sort((a, b) => a.amount - b.amount),
    [activeLocale, pricingItems],
  );

  const rechargePlans = storedValuePlans;
  const storedValueTierMeta = [
    {
      key: "foundation",
      title: { zh: "基础选择", en: "Foundation" },
      tone: "glow-blue",
      cardClass: "glass-ink",
      accentText: "text-[#4D7CFF]",
    },
    {
      key: "signature",
      title: { zh: "核心推荐", en: "Signature" },
      tone: "glow-purple",
      cardClass: "glass-purple",
      accentText: "text-[#A855F7]",
    },
    {
      key: "prestige",
      title: { zh: "极致尊享", en: "Prestige" },
      tone: "glow-magenta",
      cardClass: "glass-magenta",
      accentText: "text-[#EC4899]",
    },
  ];

  const { groupedSections, cyclePtProgramOptions, getGroupClassDays } = usePricingPresentation(
    pricingItems,
    categoryFilter,
  );
  const { deferredInstallPrompt, showInstallHint, handleInstallApp, handleDismissInstallHint } = usePwaInstallPrompt();


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

  function handlePtBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    closePtCalculator();
  }

  function handleAddPtToCart() {
    if (!selectedPtRow) return;
    const courseName = activeLocale === "zh" ? selectedPtRow.nameZh : selectedPtRow.nameEn ?? selectedPtRow.nameZh;
    addCartItem({
      name: `${courseName} · ${ptActiveLabel[activeLocale]}`,
      category: selectedPtRow.key.startsWith("assessment:") ? "assessment" : "personal_training",
      unitPrice: ptActivePresetUnit,
      quantity: ptActivePresetQty,
      note: ptCredit > 0 ? `${cartCopy.modal.creditLabel[activeLocale]} ${formatMoney(ptCredit)}` : undefined,
    });
    setSelectedPtRow(null);
  }

  function closePtCalculator() {
    setSelectedPtRow(null);
  }

  async function handleCopyQuoteSummary() {
    if (!selectedPtRow) return;
    setPtCopySuccess(false);
    const summary = buildPtSummaryText({
      reportDate: ptReportDate,
      clientName: ptClientName,
      courseNameZh: selectedPtRow.nameZh,
      courseNameEn: selectedPtRow.nameEn,
      activeLabel: ptActiveLabel,
      unit: ptActivePresetUnit,
      qty: ptActivePresetQty,
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

    const html = buildPtPdfHtml({
      courseNameZh: selectedPtRow.nameZh,
      courseNameEn: selectedPtRow.nameEn,
      reportDate: ptReportDate,
      clientName: ptClientName,
      activeLabel: ptActiveLabel[activeLocale],
      unit: ptActivePresetUnit,
      qty: ptActivePresetQty,
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
    setCycleStep(2);
  }

  function closeCyclePlanCalculator() {
    setSelectedCyclePlan(null);
    setCycleStep(1);
    setCycleSelectedPtProgram(null);
    setCycleSelectedCourses([]);
  }

  function handleCycleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    closeCyclePlanCalculator();
  }

  function handleAddCycleToCart() {
    if (!selectedCyclePlan || !cycleSelectedPtProgram) return;
    const presetLabel = (preset: PtPreset) =>
      preset === "member_1v1"
        ? { zh: "会员1v1", en: "Member 1v1" }
        : preset === "non_member_1v1"
          ? { zh: "非会员1v1", en: "Non-member 1v1" }
          : preset === "member_1v2"
            ? { zh: "会员1v2", en: "Member 1v2" }
            : { zh: "非会员1v2", en: "Non-member 1v2" };

    const programName = activeLocale === "zh" ? selectedCyclePlan.programZh : selectedCyclePlan.programEn ?? selectedCyclePlan.programZh;
    const mixLabel = activeLocale === "zh" ? "混合课程" : "Mixed Courses";
    const itemLabel = activeLocale === "zh" ? "项" : "items";

    addCartItem({
      name: `${programName} · ${mixLabel} ${cycleSelectedCourses.length || 1} ${itemLabel}`,
      category: "cycle_plan",
      unitPrice: cycleSubtotal,
      quantity: 1,
      note: activeLocale === "zh" ? selectedCyclePlan.membershipGiftZh : selectedCyclePlan.membershipGiftEn,
      details:
        cycleSelectedCourses.length > 0
          ? cycleSelectedCourses.map((course) => {
              const displayName = activeLocale === "zh"
                ? course.program.nameZh
                : course.program.nameEn
                  ? `${course.program.nameZh} / ${course.program.nameEn}`
                  : course.program.nameZh;
              return `${displayName} · ${presetLabel(course.preset)[activeLocale]} · ${course.qty}${activeLocale === "zh" ? "次" : " sessions"} · ${formatMoney(course.unitPrice)}`;
            })
          : [
              `${activeLocale === "zh"
                ? cycleSelectedPtProgram.nameZh
                : cycleSelectedPtProgram.nameEn
                  ? `${cycleSelectedPtProgram.nameZh} / ${cycleSelectedPtProgram.nameEn}`
                  : cycleSelectedPtProgram.nameZh} · ${cycleActiveLabel[activeLocale]} · ${cycleActivePresetQty}${activeLocale === "zh" ? "次" : " sessions"} · ${formatMoney(cycleActivePresetUnit)}`,
            ],
    });
    setSelectedCyclePlan(null);
    setCycleStep(1);
    setCycleSelectedPtProgram(null);
  }


  type StandardRow = (typeof groupedSections.standardSections)[number]["rows"][number];
  type GroupClassRow = NonNullable<typeof groupedSections.groupClassRows>[number];
  type StoredValuePlan = (typeof storedValuePlans)[number];

  function runAddAnimation(key: string) {
    setAddingItemKey(key);
    window.setTimeout(() => setAddingItemKey((prev) => (prev === key ? null : prev)), 850);
  }

  function showMessageToast(title: string, subtitle?: string) {
    setMessageToast({ title, subtitle });
    window.setTimeout(() => setMessageToast(null), 2000);
  }

  function addCartMembership(row: StandardRow) {
    const price = row.generalPrice ?? row.memberPrice ?? row.nonMemberPrice ?? 0;
    const name = activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh;
    const lowerName = name.toLowerCase();
    const isMonthly = lowerName.includes("月") || lowerName.includes("month") || lowerName.includes("monthly");
    const isAnnual = lowerName.includes("年") || lowerName.includes("year") || lowerName.includes("annual");
    const activationFee = isMonthly || isAnnual ? 120 : 0;
    addCartItem({
      name,
      category: "membership",
      unitPrice: price,
      isNewCustomer: false,
      activationFee,
    });
    runAddAnimation(`membership-${row.key}`);
    showMessageToast(
      activeLocale === "zh" ? "已加入报价" : "Added to Quote",
      activeLocale === "zh" ? "会籍已添加" : "Membership Added",
    );
  }

  function addCartGroupClass(row: GroupClassRow, priceType: "member" | "non_member") {
    const price =
      priceType === "member"
        ? row.memberPrice ?? row.generalPrice ?? row.nonMemberPrice ?? 0
        : row.nonMemberPrice ?? row.generalPrice ?? row.memberPrice ?? 0;
    addCartItem({
      name: activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh,
      category: "group_class",
      unitPrice: price,
    });
    runAddAnimation(`group-${priceType}-${row.key}`);
    showMessageToast(
      activeLocale === "zh" ? "已加入报价" : "Added to Quote",
      activeLocale === "zh" ? "团课已添加" : "Class Added",
    );
  }

  function addCartStoredValue(plan: StoredValuePlan) {
    addCartItem({
      name: plan.amountLabel,
      category: "stored_value",
      unitPrice: plan.amount,
      note: plan.membershipGift.zh,
    });
    runAddAnimation(`stored-${plan.id}`);
    showMessageToast(
      activeLocale === "zh" ? "已加入报价" : "Added to Quote",
      activeLocale === "zh" ? "储值已添加" : "Stored Value Added",
    );
  }

  function addAssessmentToCart(row: PtRow) {
    const unitPrice = row.member1v1 ?? row.member1v2 ?? row.nonMember1v1 ?? row.nonMember1v2 ?? 0;
    addCartItem({
      name: activeLocale === "zh" ? row.nameZh : row.nameEn ?? row.nameZh,
      category: "assessment",
      unitPrice,
      quantity: 1,
    });
    runAddAnimation(`assessment-${row.key}`);
    showMessageToast(
      activeLocale === "zh" ? "已加入报价" : "Added to Quote",
      activeLocale === "zh" ? "评估已添加" : "Assessment Added",
    );
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
      showMessageToast(
        cartCopy.toast.copySuccessTitle[activeLocale],
        cartCopy.toast.copySuccessSubtitle[activeLocale],
      );
    } catch {
      showMessageToast(
        cartCopy.toast.copyFailedTitle[activeLocale],
        cartCopy.toast.copyFailedSubtitle[activeLocale],
      );
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    let touchStartY = 0;
    let pulling = false;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing || document.body.hasAttribute("data-modal-open")) return;
      if (window.scrollY > 0) return;
      touchStartY = event.touches[0]?.clientY ?? 0;
      pulling = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling || refreshing || document.body.hasAttribute("data-modal-open")) return;
      if (window.scrollY > 0) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, currentY - touchStartY);
      const eased = Math.min(120, delta * 0.55);
      setRefreshPull(eased);
    };

    const onTouchEnd = () => {
      if (!pulling) return;
      pulling = false;
      const shouldRefresh = refreshPull > 60;
      if (shouldRefresh && !document.body.hasAttribute("data-modal-open")) {
        setRefreshing(true);
        setRefreshPull(80);
        window.location.reload();
        window.setTimeout(() => {
          setRefreshing(false);
          setRefreshPull(0);
        }, 1200);
      } else {
        setRefreshPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshPull, refreshing, isAnyModalOpen]);

  if (authState === "loading") {
    return <LoadingStitch  />;
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
    <div
      className="relative min-h-screen bg-background text-foreground pwa-screen"
      style={{ transform: refreshPull ? `translateY(${refreshPull}px)` : undefined, transition: refreshing ? "transform 0.2s ease" : undefined }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 top-0 z-[80] flex items-center justify-center"
        style={{ height: "env(safe-area-inset-top)", opacity: refreshPull > 2 || refreshing ? 1 : 0 }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1 text-[11px] text-foreground/80"
          style={{ transform: `translateY(${Math.min(0, 10 - refreshPull / 4)}px)` }}
        >
          {refreshing ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-emerald-300 border-t-transparent" />
          ) : (
            <span className={`h-2 w-2 rounded-full ${refreshPull > 12 ? "bg-emerald-200" : "bg-slate-400"}`} />
          )}
          {refreshLabel}
        </div>
      </div>

      <MessageToast
        visible={Boolean(messageToast)}
        title={messageToast?.title ?? ""}
        subtitle={messageToast?.subtitle}
        onClose={() => setMessageToast(null)}
      />

      <Navbar
        activeLocale={activeLocale}
        activeCategory={
          (categoryFilter === "group_class" || categoryFilter === "assessment" ? "membership" : categoryFilter) as
            | "membership"
            | "personal_training"
            | "cycle_plan"
            | "stored_value"
        }
        onSelectCategory={(category) => {
          setCategoryFilter(category);
        }}
        onToggleLocale={() => setActiveLocale((prev) => (prev === "zh" ? "en" : "zh"))}
        cartCount={cartTotals.itemsCount}
        onOpenCart={() => setCartOpen(true)}
        addingItemKey={addingItemKey}
        avatarInitial={(profile?.full_name || profile?.email || email || "U")[0]?.toUpperCase()}
        avatarName={profile?.full_name || profile?.email || email || "-"}
        avatarRole={profile?.role ?? (email?.toLowerCase() === "admin" ? "admin" : "sales")}
        avatarMenuOpen={avatarMenuOpen}
        onToggleAvatarMenu={() => setAvatarMenuOpen((prev) => !prev)}
        onSignOut={handleSignOut}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <PwaInstallHint
          visible={showInstallHint && Boolean(deferredInstallPrompt)}
          onInstall={handleInstallApp}
          onDismiss={handleDismissInstallHint}
        />

        <section className="mt-5 space-y-5">
          {section === "membership" &&
            groupedSections.standardSections.map(({ category, rows }) => {
              const membershipRows = (() => {
                const pickByType = new Map<number, (typeof rows)[number]>();
                const getType = (nameZh: string) => {
                  const n = nameZh.toLowerCase();
                  if (n.includes("vip") || n.includes("plus")) return -1;
                  if (n.includes("日") || n.includes("day")) return 0;
                  if (n.includes("周") || n.includes("week")) return 1;
                  if (n.includes("月") || n.includes("month") || n.includes("monthly")) return 2;
                  if (n.includes("年") || n.includes("year") || n.includes("annual")) return 3;
                  return -1;
                };

                rows.forEach((row) => {
                  const t = getType(row.nameZh);
                  if (t >= 0 && !pickByType.has(t)) pickByType.set(t, row);
                });

                return [0, 1, 2, 3].map((t) => pickByType.get(t)).filter(Boolean) as typeof rows;
              })();

              const coreAccessItems = tabCopy.pages.membership.copy.coreAccessItems.map((item) => getCopy(item));

              return (
                <article key={category} className={`${glass} membership-layered-shell px-4 py-10 md:px-8 lg:px-12`}>
                  <header className="membership-layered-header flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h3 className="membership-layered-title text-5xl font-black tracking-tight text-foreground md:text-6xl">
                        {getCopy(categoryMeta[category])}
                      </h3>
                      <p className="mt-3 text-[10px] uppercase tracking-[0.6em] text-muted-foreground">
                        {activeLocale === "zh" ? "ONYX TEAL DIGITAL INTERFACE" : "ONYX TEAL DIGITAL INTERFACE"}
                      </p>
                    </div>
                    <span className="membership-layered-pill">PREMIUM ACCESS</span>
                  </header>

                  <section className="membership-layered-grid mt-12 grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {membershipRows.map((row, index) => {
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
                      const membershipPrice = row.generalPrice ?? row.nonMemberPrice ?? row.memberPrice;
                      const displayPrice = isAnnual && typeof membershipPrice === "number"
                        ? membershipPrice / 12
                        : membershipPrice;
                      const activationFeeText = isAnnual
                        ? getCopy(tabCopy.pages.membership.copy.activationFeeCopy.annual)
                        : isMonthly
                          ? getCopy(tabCopy.pages.membership.copy.activationFeeCopy.monthly)
                          : getCopy(tabCopy.pages.membership.copy.activationFeeCopy.default);
                      const bonusItems = isAnnual
                        ? tabCopy.pages.membership.copy.bonusItems.annual
                        : isMonthly
                          ? tabCopy.pages.membership.copy.bonusItems.monthly
                          : [];

                      const cardTone = isAnnual
                        ? "membership-layered-card--featured"
                        : index === 0
                          ? "membership-layered-card--low"
                          : "membership-layered-card--mid";

                      return (
                        <article key={row.key} className={`membership-layered-card ${cardTone}`}>
                          <div className="membership-layered-card-head">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isAnnual ? "text-[var(--membership-neon)]" : "text-muted-foreground"}`}>
                              {activeLocale === "zh" ? `方案 ${index + 1}` : `Plan ${index + 1}`}
                            </span>
                            <h4 className="mt-2 text-3xl font-black text-foreground">
                              {index + 1}. {activeName}
                            </h4>
                            <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                              {activeLocale === "zh" ? "周期" : "Cycle"}: {cycleLabel}
                            </p>
                          </div>

                          <div className="membership-layered-price">
                            <span className="text-[10px] uppercase tracking-tight text-muted-foreground">
                              {activeLocale === "zh" ? "会籍价格" : "Membership Price"}
                            </span>
                            <div className="membership-layered-price-value">
                              {formatMoney(displayPrice ?? undefined)}
                              {isAnnual && (
                                <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {activeLocale === "zh" ? "每月" : "Per month"}
                                </span>
                              )}
                            </div>
                            <div className="mt-4 text-[10px] text-muted-foreground">
                              <p className="uppercase">{activeLocale === "zh" ? "激活费" : "Activation"}</p>
                              <p className={`${isAnnual ? "text-[var(--membership-neon)]" : "text-muted-foreground"} mt-1`}>
                                {activationFeeText}
                              </p>
                            </div>
                          </div>

                          <div className="membership-layered-benefits">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {activeLocale === "zh" ? "核心权益" : "Core Access"}
                            </p>
                            <ul className="membership-layered-list">
                              {coreAccessItems.map((item) => (
                                <li key={`${row.key}-${item}`} className="membership-layered-list-item">
                                  <span className="membership-layered-dot" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="membership-layered-bonus">
                            <p className="text-[9px] uppercase text-muted-foreground">
                              {activeLocale === "zh" ? "加赠福利" : "Bonus"}
                            </p>
                            {bonusItems.length > 0 ? (
                              <div className="space-y-3 text-[12px]">
                                {bonusItems.map((item) => {
                                  const iconMap: Record<string, typeof Gift> = {
                                    "Drink Voucher": CupSoda,
                                    "Meal Voucher": UtensilsCrossed,
                                    "Weekly Pass": CalendarDays,
                                  };
                                  const Icon = iconMap[item.en] ?? Gift;
                                  return (
                                    <div key={`${row.key}-${item.en}`} className="flex items-center justify-between gap-3 text-foreground/80">
                                      <span className="flex items-center gap-2">
                                        <Icon size={14} className="text-[var(--membership-neon)]" />
                                        {getCopy(item)}
                                      </span>
                                      <span className="text-[var(--membership-neon)] font-bold">×{item.qty}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[12px] italic text-muted-foreground">{getCopy(tabCopy.pages.membership.copy.bonusItems.none)}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => addCartMembership(row)}
                              className={`membership-layered-action ${isAnnual ? "membership-layered-action--featured" : ""} ${
                                addingItemKey === `membership-${row.key}` ? "membership-layered-action--active" : ""
                              }`}
                              aria-label="加入报价"
                              title="加入报价"
                            >
                              {activeLocale === "zh" ? "+ 加入报价" : "+ Add"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </section>

                  <div className="mt-12 space-y-8">
                    <section className="space-y-6">
                      <div className="flex items-end justify-between">
                        <h4 className="text-3xl font-black tracking-tight text-foreground">
                          {getCopy(tabCopy.pages.membership.copy.newSignupTitle)}
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">
                          {getCopy(tabCopy.pages.membership.copy.newSignupBadge)}
                        </span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {tabCopy.pages.membership.copy.newSignupBenefits.map((benefit) => (
                          <div key={benefit.en} className="membership-layered-panel">
                            <div className="flex items-center gap-3">
                              <span className="membership-layered-dot" />
                              <p className="text-[13px] font-medium text-foreground/80">
                                {getCopy(benefit)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-5 pb-4">
                      <div className="flex items-end justify-between border-b border-border pb-4">
                        <div>
                          <h4 className="text-3xl font-black tracking-tight text-foreground uppercase">
                            {getCopy(tabCopy.pages.membership.copy.groupClass.title)}
                          </h4>
                          <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                            {activeLocale === "zh" ? "Class Pricing Structure" : "Class Pricing Structure"}
                          </p>
                        </div>
                        <span className="membership-layered-badge">
                          {getCopy(tabCopy.pages.membership.copy.groupClass.badge)}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {groupedSections.groupClassRows?.map((row, index) => {
                          const groupClassDays = getGroupClassDays(row.modeKey);
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
                            <article key={row.key} className="membership-layered-class">
                              <div className="md:col-span-4">
                                <h5 className="text-xl font-black text-foreground">
                                  {index + 1}. {displayName}
                                </h5>
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">
                                  {activeLocale === "zh" ? "模式" : "Mode"}: {modeLabel} | {activeLocale === "zh" ? "周期" : "Duration"}: {durationLabel}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <span className="membership-layered-class-label">
                                  {getCopy(tabCopy.pages.membership.copy.groupClass.columns.member)}
                                </span>
                                <p className="membership-layered-class-price membership-layered-class-price--member">
                                  {formatMoney(row.memberPrice)}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <span className="membership-layered-class-label">
                                  {getCopy(tabCopy.pages.membership.copy.groupClass.columns.nonMember)}
                                </span>
                                <p className="membership-layered-class-price">
                                  {formatMoney(row.nonMemberPrice)}
                                </p>
                              </div>
                              <div className="md:col-span-4 flex items-center">
                                <div className="flex gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={() => addCartGroupClass(row, "member")}
                                    className={`membership-layered-action membership-layered-action--inline membership-layered-action--compact ${
                                      addingItemKey === `group-member-${row.key}` ? "membership-layered-action--active" : ""
                                    }`}
                                    aria-label="加入会员价"
                                    title="加入会员价"
                                  >
                                    {activeLocale === "zh" ? "会员价" : "Member"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addCartGroupClass(row, "non_member")}
                                    className={`membership-layered-action membership-layered-action--inline membership-layered-action--compact ${
                                      addingItemKey === `group-non_member-${row.key}` ? "membership-layered-action--active" : ""
                                    }`}
                                    aria-label="加入非会员价"
                                    title="加入非会员价"
                                  >
                                    {activeLocale === "zh" ? "非会员" : "Non-member"}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </article>
              );
            })}

          {section === "stored_value" && (
            <article className={`${glass} stored-value-shell relative p-5 sm:p-6 lg:p-12`}>
              <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-10 sm:gap-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border/70 pb-8 sm:pb-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-px bg-gradient-to-r from-[#4D7CFF] to-[#EC4899]" />
                      <span className="text-[10px] font-bold tracking-[0.6em] uppercase text-muted-foreground">
                        {activeLocale === "zh" ? "会员计划" : "Membership Programs"}
                      </span>
                    </div>
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tighter">
                      {getCopy(tabCopy.pages.storedValue.copy.title)}
                    </h3>
                  </div>
                  <div className="mt-6 md:mt-0 bg-card/70 px-6 sm:px-8 py-4 sm:py-5 border border-border/70 backdrop-blur-md">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      {activeLocale === "zh" ? "当前活动" : "Active Tiers"}
                    </p>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-futuristic font-bold text-foreground leading-none">
                      {rechargePlans.length.toString().padStart(2, "0")}
                      <span className="text-xs font-sans text-muted-foreground align-middle ml-2">
                        {activeLocale === "zh" ? "项活动" : "items"}
                      </span>
                    </p>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                  <aside className="order-2 lg:order-1 lg:col-span-4 lg:sticky lg:top-12 text-left">
                    <div className="mb-8 sm:mb-10">
                      <h4 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                        {getCopy(tabCopy.pages.storedValue.copy.promoTitle)}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      {promotionGroups.flatMap((group) => group.items).map((promo, index) => {
                        const isSelected = selectedPromoTrigger === promo.trigger;
                        return (
                          <button
                            type="button"
                            key={`${promo.trigger}-${index}`}
                            onClick={() => setSelectedPromoTrigger(promo.trigger)}
                            className={`benefit-item group flex w-full items-center text-left justify-between p-5 border-b border-border/70 transition-colors hover:bg-card/70 hover:pl-7 ${
                              isSelected ? "bg-card/80" : ""
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <span className={`material-symbols-outlined text-muted-foreground transition-colors ${
                                isSelected ? "text-foreground" : "group-hover:text-foreground/80"
                              }`}>verified</span>
                              <div>
                                <h3 className="text-[13px] font-bold text-foreground">
                                  {getCopy(promo.title)}
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {getCopy(promo.detail)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="indicator-square bg-[#4D7CFF] shadow-[0_0_10px_rgba(77,124,255,0.5)]" />
                              <div className="indicator-square bg-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                              <div className="indicator-square bg-[#EC4899] shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  <main className="order-1 lg:order-2 lg:col-span-8 relative flex flex-col items-center">
                    <div className="architectural-glow"></div>
                    {(() => {
                      const orderedRechargePlans = [...rechargePlans].sort((a, b) => a.amount - b.amount);

                      return orderedRechargePlans.map((plan, index) => {
                        const meta = storedValueTierMeta[index] ?? storedValueTierMeta[0];
                        const midPlan = orderedRechargePlans[1];
                        const topPlan = orderedRechargePlans[orderedRechargePlans.length - 1];
                        const isFirst = index === 0;
                        const isMidTier = midPlan ? plan.id === midPlan.id : false;
                        const isTopTier = topPlan ? plan.id === topPlan.id : false;
                        const showBadge = index > 0 && (isMidTier || isTopTier);
                        const amountDisplay = formatMoney(plan.amount);
                        const cardWidth = isFirst ? "w-full sm:w-[90%]" : isMidTier ? "w-full sm:w-[95%]" : "w-full";
                        const paddingSize = isFirst ? "p-6 sm:p-8" : isMidTier ? "p-7 sm:p-10" : "p-8 sm:p-12";
                        const titleSize = isFirst ? "text-base sm:text-lg" : isMidTier ? "text-lg sm:text-xl" : "text-xl sm:text-2xl";
                        const amountSize = isFirst ? "text-4xl sm:text-6xl" : isMidTier ? "text-5xl sm:text-7xl" : "text-6xl sm:text-8xl";
                        const gridGap = isFirst ? "gap-4 sm:gap-6" : isMidTier ? "gap-5 sm:gap-8" : "gap-6 sm:gap-10";
                        const gridPadding = isFirst ? "pt-5 sm:pt-6" : isMidTier ? "pt-6 sm:pt-8" : "pt-7 sm:pt-10";
                        const pointsSize = isFirst ? "text-xl sm:text-2xl" : isMidTier ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl";
                        const valueClass = `font-futuristic leading-none ${pointsSize}`;
                        const buttonPadding = isTopTier ? "px-7 sm:px-10 py-3 text-sm sm:text-base" : "px-5 sm:px-6 py-2 text-xs sm:text-sm";
                        const buttonShadow = isTopTier
                          ? "shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                          : isMidTier
                            ? "shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                            : "shadow-[0_0_20px_rgba(77,124,255,0.4)]";
                        const buttonTint = isTopTier
                          ? "border-border/80 text-foreground"
                          : isMidTier
                            ? "border-border/80 text-foreground"
                            : "border-border/80 text-foreground";
                        const perkList = activeLocale === "zh"
                          ? ["专属会员卡面", "包含全场通用权限"]
                          : ["Exclusive card", "All-access"];

                        return (
                          <div
                            role="button"
                            tabIndex={0}
                            key={`${plan.id}-tier`}
                            className={`relative tier-card ${cardWidth} ${paddingSize} mb-2 sm:mb-[-2px] ${meta.cardClass} border-l-2 transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl ${
                              isTopTier ? "shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)]" : ""
                            }`}
                          >
                            {showBadge && (
                              <div className={`absolute top-0 right-6 sm:right-10 z-30 -translate-y-1/2 px-3 sm:px-4 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground opacity-100 pointer-events-none ${
                                isTopTier ? "bg-[#EC4899]" : "bg-[#A855F7]"
                              }`}>
                                {isMidTier
                                  ? getCopy(tabCopy.pages.storedValue.copy.badges.mostPopular)
                                  : getCopy(tabCopy.pages.storedValue.copy.badges.bestValue)}
                              </div>
                            )}

                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                              <div className="flex-1">
                                <p className={`font-futuristic ${titleSize} tracking-[0.3em] ${meta.accentText} mb-1`}>
                                  {activeLocale === "zh" ? meta.title.zh : meta.title.en.toUpperCase()}
                                </p>
                                <h4 className={`font-futuristic font-bold text-foreground tracking-wide ${amountSize}`}>
                                  {amountDisplay}
                                </h4>
                                <div className={`mt-6 grid grid-cols-2 md:grid-cols-3 items-end ${gridGap} border-t border-white/10 ${gridPadding}`}>
                                  <div>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
                                      {activeLocale === "zh" ? "赠送会员" : "Membership"}
                                    </p>
                                    <p className={`${valueClass} text-foreground`}>
                                      {getCopy(plan.membershipGift)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
                                      {activeLocale === "zh" ? "赠送积分" : "Bonus Credit"}
                                    </p>
                                    <p className={`${valueClass} text-foreground`}>
                                      {formatMoney(plan.bonusCredit)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
                                      {activeLocale === "zh" ? "赠送价值" : "Gift Value"}
                                    </p>
                                    <p className={`${valueClass} ${meta.accentText}`}>
                                      {formatMoney(plan.totalValue)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex w-full md:w-auto flex-col items-start md:items-end justify-between gap-6 md:gap-8 self-stretch">
                                <div className={`${isTopTier ? "space-y-4 text-base" : isMidTier ? "space-y-3 text-sm" : "space-y-2 text-[11px]"} text-left md:text-right text-foreground`}>
                                  {perkList.map((perk) => (
                                    <div key={perk} className={`flex items-center justify-start md:justify-end gap-2 ${isTopTier ? "font-bold tracking-tight" : ""}`}>
                                      <span className={isTopTier ? "italic" : ""}>{perk}</span>
                                      <span className={`material-symbols-outlined ${meta.accentText} ${isTopTier ? "fill-[1]" : ""}`}>
                                        {isTopTier ? "stars" : "check_circle"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    addCartStoredValue(plan);
                                  }}
                                  className={`btn-join ${buttonPadding} font-bold tracking-widest uppercase transition-all duration-300 border-2 bg-card/40 backdrop-blur-sm ${buttonTint} ${buttonShadow} hover:brightness-110 active:scale-95`}
                                  aria-label="加入报价"
                                  title="加入报价"
                                >
                                  {activeLocale === "zh" ? "加入报价" : "Add"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </main>
                </div>
              </div>
            </article>
          )}

          {section === "personal_training" && groupedSections.ptSection && (
            <article className={`${glass} p-4`}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{getCopy(tabCopy.pages.personalTraining.copy.title)}</h3>
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
                          <p className="text-sm font-semibold text-foreground">{getCopy(tabCopy.pages.personalTraining.copy.assessment)}</p>
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
                        className={`group relative overflow-hidden rounded-xl border bg-card px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition-all duration-500 ${
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
                                <ProgramIcon size={14} className="text-foreground/80" />
                              </div>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {index + 1}. {displayName}
                                </p>
                                {row.key.startsWith("assessment:") && (
                                  <span className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] text-foreground">
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
                                <p className="mt-1 text-foreground/80">{focusText}</p>
                              </div>
                            )}
                            {idealForText && (
                              <div className="text-xs">
                                <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.idealFor)}</p>
                                <p className="mt-1 text-foreground/80">{idealForText}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`relative mt-3 grid gap-2 text-xs md:grid-cols-2 ${isAssessmentItem ? "pb-7" : ""}`}>
                          <div className="border-l-2 border-emerald-300/40 pl-2">
                            <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.pricing.label1v1)}</p>
                            <p className="text-foreground/80">
                              {getCopy(tabCopy.pages.personalTraining.copy.pricing.member)}: <span className="font-semibold text-foreground/80">{formatMoney(row.member1v1)}</span>
                            </p>
                            <p className="text-foreground/80">
                              {getCopy(tabCopy.pages.personalTraining.copy.pricing.nonMember)}: <span className="font-semibold text-foreground/80">{formatMoney(row.nonMember1v1)}</span>
                            </p>
                          </div>
                          <div className="border-l-2 border-cyan-300/40 pl-2">
                            <p className="text-slate-500">{getCopy(tabCopy.pages.personalTraining.copy.pricing.label1v2)}</p>
                            <p className="text-foreground/80">
                              {getCopy(tabCopy.pages.personalTraining.copy.pricing.member)}: <span className="font-semibold text-foreground/80">{formatMoney(row.member1v2)}</span>
                            </p>
                            <p className="text-foreground/80">
                              {getCopy(tabCopy.pages.personalTraining.copy.pricing.nonMember)}: <span className="font-semibold text-foreground/80">{formatMoney(row.nonMember1v2)}</span>
                            </p>
                          </div>

                          {isAssessmentItem && (
                            <div className="absolute bottom-0 right-0">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  addAssessmentToCart(row);
                                }}
                                className={`membership-layered-action membership-layered-action--inline membership-layered-action--compact inline-flex items-center justify-center h-6 px-2.5 text-[10px] bg-emerald-400/30 border-emerald-300/70 text-foreground shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:bg-emerald-400/40 hover:border-emerald-200/90 hover:text-foreground ${
                                  addingItemKey === `assessment-${row.key}` ? "membership-layered-action--active" : ""
                                }`}
                                aria-label="加入报价"
                                title="加入报价"
                              >
                                {activeLocale === "zh" ? "加入报价" : "Add"}
                              </button>
                            </div>
                          )}
                        </div>

                      </article>
                    </div>
                  );
                })}
              </div>
            </article>
          )}

          {section === "cycle_plan" && groupedSections.cyclePlanRows && (
            <article className={`${glass} overflow-hidden p-4 md:p-5`}>
              <div className="mb-5 flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {getCopy(tabCopy.pages.cyclePlan.copy.title)}
                </h3>
                <p className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-foreground">
                  {getCopy(tabCopy.pages.cyclePlan.copy.badge)}
                </p>
              </div>

              <div className="space-y-3">
                {groupedSections.cyclePlanRows.map((row, idx) => (
                  <div key={row.program} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleCyclePlanCardTap(row)}
                      className={`group relative w-full overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all duration-300 active:scale-[0.995] ${
                        cyclePreviewPlan?.program === row.program
                          ? "border-border shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                          : "border-border/80 hover:border-border hover:shadow-[0_0_16px_rgba(124,58,237,0.08)]"
                      }`}
                    >
                      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 bg-[radial-gradient(circle_at_85%_18%,color-mix(in_srgb,var(--color-primary-soft)_30%,transparent),transparent_40%)] ${cyclePreviewPlan?.program === row.program ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />

                      <div className="relative grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {cyclePreviewPlan?.program === row.program && (
                              <span className="inline-flex h-5 w-5 items-center justify-center">
                                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary-soft)] shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary-soft)_45%,transparent)] animate-[pulse_1.5s_ease-in-out_infinite]" />
                              </span>
                            )}
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-sm font-bold text-foreground">
                              {idx + 1}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              {activeLocale === "zh" ? "周期方案" : "Cycle Program"}
                            </p>
                            <p className="mt-0.5 text-[17px] font-semibold text-foreground">
                              {activeLocale === "zh" ? row.programZh : row.programEn ?? row.programZh}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
                            <p className="text-[10px] leading-tight text-muted-foreground">
                              {cycleCopy[activeLocale].weeklySessions}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{row.weeklySessions}</p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
                            <p className="text-[10px] leading-tight text-muted-foreground">
                              {cycleCopy[activeLocale].minSessions}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{row.minSessions}</p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
                            <p className="text-[10px] leading-tight text-muted-foreground">
                              {cycleCopy[activeLocale].followups}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{row.wpdFollowups}</p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
                            <p className="text-[10px] leading-tight text-muted-foreground">
                              {cycleCopy[activeLocale].assessments}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{row.assessmentsReports}</p>
                          </div>
                        </div>

                        <div className="space-y-2 lg:text-right">
                          <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2">
                            <p className="text-[10px] leading-tight text-muted-foreground">
                              {cycleCopy[activeLocale].membershipGift}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {activeLocale === "zh" ? row.membershipGiftZh : row.membershipGiftEn}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {cycleCopy[activeLocale].extraBenefits}: 
                            <span className="font-medium text-foreground/80">
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
                <h4 className="text-sm font-semibold text-foreground">
                  {activeLocale === "zh" ? "课程福利" : "Program Benefits"}
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {tabCopy.pages.cyclePlan.copy.programBenefits.map((benefit) => (
                    <li key={benefit.en}>{getCopy(benefit)}</li>
                  ))}
                </ul>
              </div>
            </article>
          )}
        </section>

        {section === "personal_training" && (
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
            ptActivePresetUnit={ptActivePresetUnit}
            ptActivePresetQty={ptActivePresetQty}
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
            onBackdropClick={handlePtBackdropClick}
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
        )}

        {section === "cycle_plan" && (
          <CyclePlanModal
            selectedCyclePlan={selectedCyclePlan}
            activeLocale={activeLocale}
            cycleStep={cycleStep}
            cyclePtProgramOptions={cyclePtProgramOptions}
            cycleSelectedCourses={cycleSelectedCourses}
            cycleClientName={cycleClientName}
            onSetCycleSelectedCourses={setCycleSelectedCourses}
            cycleCreditInputStr={cycleCreditInputStr}
            cycleCredit={cycleCredit}
            cycleSubtotal={cycleSubtotal}
            cycleAfterCredit={cycleAfterCredit}
            cycleTax={cycleTax}
            cycleTotal={cycleTotal}
            onClose={closeCyclePlanCalculator}
            onBackdropClick={handleCycleBackdropClick}
            onSetCycleStep={setCycleStep}
            onSelectProgramAndContinue={selectCyclePtProgramAndContinue}
            onSetCycleClientName={setCycleClientName}
            onSetCycleCreditInputStr={setCycleCreditInputStr}
            onSetCycleCredit={setCycleCredit}
            onAddToCart={handleAddCycleToCart}
          />
        )}

        <CartQuoteModal
          open={cartOpen}
          items={cartItems}
          totals={cartTotals}
          customer={cartCustomer}
          creditApplied={cartCreditApplied}
          onCreditChange={setCartCreditApplied}
          onClose={() => setCartOpen(false)}
          onRemoveItem={removeCartItem}
          onUpdateItem={updateCartItem}
          onUpdateCustomer={updateCartCustomer}
          onClearCart={clearCart}
          onCopySummary={handleCopyCartSummary}
          onDownloadPdf={handleDownloadCartPdf}
          lastAddedId={lastAddedId}
          onAnimationComplete={clearLastAdded}
          activeLocale={activeLocale}
        />
      </div>
    </div>
  );
}
