import { useMemo } from "react";

import type { PricingItem } from "@/types/pricing";
import { asNumber } from "@/lib/formatters/number";
import {
  displayMode,
  getCycleRankFromProgram,
  getGroupClassDays,
  getMembershipRank,
  getModeSortRank,
} from "@/lib/pricing/helpers";
import type { CompareRow, CyclePlanRow, PricingCategory, PtRow } from "@/types/pricing";

type CategoryFilter = "all" | PricingCategory;

export function usePricingPresentation(pricingItems: PricingItem[], categoryFilter: CategoryFilter) {

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
      .filter(
        (category) =>
          category !== "group_class" &&
          category !== "personal_training" &&
          category !== "assessment" &&
          category !== "stored_value" &&
          category !== "cycle_plan",
      )
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

          return a.nameZh.localeCompare(b.nameZh);
        });

        return {
          category,
          rows: sortedRows,
        };
      });

    const groupClassRows =
      (categoryFilter === "all" || categoryFilter === "group_class" || categoryFilter === "membership") && grouped.group_class.length > 0
        ? grouped.group_class
            .reduce<CompareRow[]>((acc, item) => {
              const rowKey = `${item.name_zh}|${item.session_mode ?? "general"}`;
              const existing = acc.find((row) => row.key === rowKey);

              if (!existing) {
                const next: CompareRow = {
                  key: rowKey,
                  itemIds: [item.id],
                  nameZh: item.name_zh,
                  nameEn: item.name_en,
                  mode: displayMode(item.session_mode),
                  modeKey: item.session_mode,
                };
                if (item.member_type === "member") next.memberPrice = item.price;
                else if (item.member_type === "non_member") next.nonMemberPrice = item.price;
                else next.generalPrice = item.price;
                acc.push(next);
                return acc;
              }

              if (!existing.itemIds.includes(item.id)) existing.itemIds.push(item.id);
              if (item.member_type === "member") existing.memberPrice = item.price;
              else if (item.member_type === "non_member") existing.nonMemberPrice = item.price;
              else existing.generalPrice = item.price;
              return acc;
            }, [])
            .sort((a, b) => {
              const modeRankDiff = getModeSortRank(a.modeKey) - getModeSortRank(b.modeKey);
              if (modeRankDiff !== 0) return modeRankDiff;
              return a.nameZh.localeCompare(b.nameZh);
            })
        : null;

    let ptSection: { category: PricingItem["category"]; rows: PtRow[] } | null = null;
    let cyclePlanRows: CyclePlanRow[] | null = null;

    if (
      (categoryFilter === "all" || categoryFilter === "personal_training" || categoryFilter === "assessment") &&
      (grouped.personal_training.length > 0 || grouped.assessment.length > 0)
    ) {
      const ptMap = new Map<string, PtRow>();

      grouped.personal_training.forEach((item) => {
        const key = item.name_zh;
        if (!ptMap.has(key)) {
          ptMap.set(key, {
            key,
            itemIds: [item.id],
            nameZh: item.name_zh,
            nameEn: item.name_en,
            focusZh: typeof item.meta?.focus === "string" ? item.meta.focus : undefined,
            focusEn: typeof item.meta?.focus_en === "string" ? item.meta.focus_en : undefined,
            idealForZh: typeof item.meta?.target === "string" ? item.meta.target : undefined,
            idealForEn: typeof item.meta?.target_en === "string" ? item.meta.target_en : undefined,
          });
        }

        const row = ptMap.get(key)!;
        if (!row.itemIds.includes(item.id)) row.itemIds.push(item.id);
        if (!row.nameEn && item.name_en) row.nameEn = item.name_en;

        if (item.member_type === "member" && item.session_mode === "1v1") row.member1v1 = item.price;
        if (item.member_type === "member" && item.session_mode === "1v2") row.member1v2 = item.price;
        if (item.member_type === "non_member" && item.session_mode === "1v1") row.nonMember1v1 = item.price;
        if (item.member_type === "non_member" && item.session_mode === "1v2") row.nonMember1v2 = item.price;
      });

      grouped.assessment.forEach((item) => {
        const key = `assessment:${item.name_zh}`;
        if (!ptMap.has(key)) {
          ptMap.set(key, {
            key,
            itemIds: [item.id],
            nameZh: item.name_zh,
            nameEn: item.name_en,
            focusZh: typeof item.meta?.focus === "string" ? item.meta.focus : undefined,
            focusEn: typeof item.meta?.focus_en === "string" ? item.meta.focus_en : undefined,
            idealForZh: typeof item.meta?.target === "string" ? item.meta.target : undefined,
            idealForEn: typeof item.meta?.target_en === "string" ? item.meta.target_en : undefined,
            member1v1: item.price,
            nonMember1v1: item.price,
            member1v2: item.price,
            nonMember1v2: item.price,
          });
        }
      });

      ptSection = {
        category: "personal_training",
        rows: Array.from(ptMap.values()).sort((a, b) => {
          const aIsAssessment = a.key.startsWith("assessment:");
          const bIsAssessment = b.key.startsWith("assessment:");
          if (aIsAssessment !== bIsAssessment) return aIsAssessment ? 1 : -1;

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
          const membershipGiftZh = weeks ? `${weeks}周会员` : "-";
          const membershipGiftEn = weeks ? `${weeks}-Week Membership` : "-";

          return {
            key: item.id,
            program: `${item.name_zh.includes("计划") ? item.name_zh : `${weeks ?? "-"}周计划`} / ${weeks ?? "-"}-Week Program`,
            programZh: item.name_zh.includes("计划") ? item.name_zh : `${weeks ?? "-"}周计划`,
            programEn: item.name_en ?? (weeks ? `${weeks}-Week Program` : "-"),
            weeklySessions: sessionsPerWeek,
            wpdFollowups,
            assessmentsReports,
            minSessions: minSessions ? String(minSessions) : "-",
            membershipGift: `${membershipGiftEn} / ${membershipGiftZh}`,
            membershipGiftZh,
            membershipGiftEn,
            extraBenefits: "Member-rate packages / 会员价购买套餐课",
            extraBenefitsZh: "会员价购买套餐课",
            extraBenefitsEn: "Member-rate packages",
            unitPrice: item.price ?? 0,
          };
        })
        .sort((a, b) => getCycleRankFromProgram(a.program) - getCycleRankFromProgram(b.program));
    }

    return { standardSections, groupClassRows, ptSection, cyclePlanRows };
  }, [pricingItems, categoryFilter]);

  const cyclePtProgramOptions = useMemo(() => {
    const ptItems = pricingItems.filter((item) => item.category === "personal_training");
    const ptMap = new Map<string, PtRow>();

    ptItems.forEach((item) => {
      const key = item.name_zh;
      if (!ptMap.has(key)) {
        ptMap.set(key, {
          key,
          itemIds: [item.id],
          nameZh: item.name_zh,
          nameEn: item.name_en,
          focusZh: typeof item.meta?.focus === "string" ? item.meta.focus : undefined,
          focusEn: typeof item.meta?.focus_en === "string" ? item.meta.focus_en : undefined,
          idealForZh: typeof item.meta?.target === "string" ? item.meta.target : undefined,
          idealForEn: typeof item.meta?.target_en === "string" ? item.meta.target_en : undefined,
        });
      }

      const row = ptMap.get(key)!;
      if (!row.itemIds.includes(item.id)) row.itemIds.push(item.id);

      if (item.member_type === "member" && item.session_mode === "1v1") row.member1v1 = item.price;
      if (item.member_type === "member" && item.session_mode === "1v2") row.member1v2 = item.price;
      if (item.member_type === "non_member" && item.session_mode === "1v1") row.nonMember1v1 = item.price;
      if (item.member_type === "non_member" && item.session_mode === "1v2") row.nonMember1v2 = item.price;
    });

    return Array.from(ptMap.values()).sort((a, b) => (a.member1v1 ?? 0) - (b.member1v1 ?? 0));
  }, [pricingItems]);

  return {
    groupedSections,
    cyclePtProgramOptions,
    getGroupClassDays,
  };
}
