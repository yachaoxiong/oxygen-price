import { useState } from "react";

import { PRICING_CONFIG } from "@/lib/config/pricing";
import {
  calcAfterCredit,
  calcSubtotal,
  calcTax,
  getPresetUnitAndQty,
} from "@/lib/pricing/calculate";
import type { CycleCourseSelection, CyclePlanRow, PtPreset, PtRow } from "@/types/pricing";

export function useCycleCalculatorState() {
  const [selectedCyclePlan, setSelectedCyclePlan] = useState<CyclePlanRow | null>(null);
  const [cyclePreviewPlan, setCyclePreviewPlan] = useState<CyclePlanRow | null>(null);
  const [cycleStep, setCycleStep] = useState<1 | 2>(1);
  const [cycleSelectedPtProgram, setCycleSelectedPtProgram] = useState<PtRow | null>(null);
  const [cycleSelectedCourses, setCycleSelectedCourses] = useState<CycleCourseSelection[]>([]);
  const [cycleClientName, setCycleClientName] = useState("");
  const [cycleCopied, setCycleCopied] = useState(false);
  const [cyclePtPreset, setCyclePtPreset] = useState<PtPreset>("member_1v1");
  const [cycleUnitMember1v1, setCycleUnitMember1v1] = useState<number>(0);
  const [cycleUnitNonMember1v1, setCycleUnitNonMember1v1] = useState<number>(0);
  const [cycleUnitMember1v2, setCycleUnitMember1v2] = useState<number>(0);
  const [cycleUnitNonMember1v2, setCycleUnitNonMember1v2] = useState<number>(0);
  const [cycleQtyMember1v1, setCycleQtyMember1v1] = useState<number>(PRICING_CONFIG.defaultSessionQty);
  const [cycleQtyNonMember1v1, setCycleQtyNonMember1v1] = useState<number>(12);
  const [cycleQtyMember1v2, setCycleQtyMember1v2] = useState<number>(12);
  const [cycleQtyNonMember1v2, setCycleQtyNonMember1v2] = useState<number>(12);
  const [cycleCredit, setCycleCredit] = useState<number>(0);
  const [cycleCreditInputStr, setCycleCreditInputStr] = useState<string>("0");

  const cycleCalcMember1v1 = calcSubtotal(cycleUnitMember1v1, cycleQtyMember1v1);
  const cycleCalcNonMember1v1 = calcSubtotal(cycleUnitNonMember1v1, cycleQtyNonMember1v1);
  const cycleCalcMember1v2 = calcSubtotal(cycleUnitMember1v2, cycleQtyMember1v2);
  const cycleCalcNonMember1v2 = calcSubtotal(cycleUnitNonMember1v2, cycleQtyNonMember1v2);

  const cycleCourseSubtotal = cycleSelectedCourses.reduce(
    (sum, course) => sum + calcSubtotal(course.unitPrice, course.qty),
    0,
  );

  const cycleActiveLabel =
    cyclePtPreset === "member_1v1"
      ? { zh: "会员 1v1", en: "Member 1v1" }
      : cyclePtPreset === "non_member_1v1"
        ? { zh: "非会员 1v1", en: "Non-member 1v1" }
        : cyclePtPreset === "member_1v2"
          ? { zh: "会员 1v2", en: "Member 1v2" }
          : { zh: "非会员 1v2", en: "Non-member 1v2" };

  const cycleActivePreset = getPresetUnitAndQty(cyclePtPreset, {
    member1v1Unit: cycleUnitMember1v1,
    nonMember1v1Unit: cycleUnitNonMember1v1,
    member1v2Unit: cycleUnitMember1v2,
    nonMember1v2Unit: cycleUnitNonMember1v2,
    member1v1Qty: cycleQtyMember1v1,
    nonMember1v1Qty: cycleQtyNonMember1v1,
    member1v2Qty: cycleQtyMember1v2,
    nonMember1v2Qty: cycleQtyNonMember1v2,
  });

  const cycleSubtotal = cycleSelectedCourses.length > 0
    ? cycleCourseSubtotal
    : calcSubtotal(cycleActivePreset.unit, cycleActivePreset.qty);

  const cycleActivePresetUnit = cycleActivePreset.unit;
  const cycleActivePresetQty = cycleActivePreset.qty;

  const cycleTax = calcTax(cycleSubtotal);
  const cycleAfterCredit = calcAfterCredit(cycleSubtotal + cycleTax, cycleCredit);
  const cycleTotal = cycleAfterCredit;

  return {
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
    cycleCalcMember1v1,
    cycleCalcNonMember1v1,
    cycleCalcMember1v2,
    cycleCalcNonMember1v2,
    cycleActiveLabel,
    cycleActivePresetUnit,
    cycleActivePresetQty,
    cycleSubtotal,
    cycleAfterCredit,
    cycleTax,
    cycleTotal,
  };
}
