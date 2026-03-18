import { useState } from "react";

import { PRICING_CONFIG } from "@/lib/config/pricing";
import {
  calcAfterCredit,
  calcSubtotal,
  calcTax,
  calcTotalWithTax,
  getPresetUnitAndQty,
} from "@/lib/pricing/calculate";
import type { PtPreset, PtRow } from "@/types/pricing";

type PtActiveLabel = {
  zh: string;
  en: string;
};

export function usePtCalculatorState() {
  const [selectedPtRow, setSelectedPtRow] = useState<PtRow | null>(null);
  const [ptPreviewRow, setPtPreviewRow] = useState<PtRow | null>(null);
  const [ptUnitMember1v1, setPtUnitMember1v1] = useState<number>(0);
  const [ptUnitNonMember1v1, setPtUnitNonMember1v1] = useState<number>(0);
  const [ptUnitMember1v2, setPtUnitMember1v2] = useState<number>(0);
  const [ptUnitNonMember1v2, setPtUnitNonMember1v2] = useState<number>(0);
  const [ptQtyMember1v1, setPtQtyMember1v1] = useState<number>(PRICING_CONFIG.defaultSessionQty);
  const [ptQtyNonMember1v1, setPtQtyNonMember1v1] = useState<number>(12);
  const [ptQtyMember1v2, setPtQtyMember1v2] = useState<number>(12);
  const [ptQtyNonMember1v2, setPtQtyNonMember1v2] = useState<number>(12);
  const [ptPreset, setPtPreset] = useState<PtPreset>("member_1v1");
  const [ptCredit, setPtCredit] = useState<number>(0);
  const [ptCopySuccess, setPtCopySuccess] = useState(false);
  const [ptUnitInputEmpty, setPtUnitInputEmpty] = useState(false);
  const [ptQtyInputEmpty, setPtQtyInputEmpty] = useState(false);
  const [ptCreditInputEmpty, setPtCreditInputEmpty] = useState(false);
  const [ptClientName, setPtClientName] = useState("");

  const ptCalcMember1v1 = calcSubtotal(ptUnitMember1v1, ptQtyMember1v1);
  const ptCalcNonMember1v1 = calcSubtotal(ptUnitNonMember1v1, ptQtyNonMember1v1);
  const ptCalcMember1v2 = calcSubtotal(ptUnitMember1v2, ptQtyMember1v2);
  const ptCalcNonMember1v2 = calcSubtotal(ptUnitNonMember1v2, ptQtyNonMember1v2);


  const ptActiveLabel: PtActiveLabel =
    ptPreset === "member_1v1"
      ? { zh: "会员 1v1", en: "Member 1v1" }
      : ptPreset === "non_member_1v1"
        ? { zh: "非会员 1v1", en: "Non-member 1v1" }
        : ptPreset === "member_1v2"
          ? { zh: "会员 1v2", en: "Member 1v2" }
          : { zh: "非会员 1v2", en: "Non-member 1v2" };

  const ptActivePreset = getPresetUnitAndQty(ptPreset, {
    member1v1Unit: ptUnitMember1v1,
    nonMember1v1Unit: ptUnitNonMember1v1,
    member1v2Unit: ptUnitMember1v2,
    nonMember1v2Unit: ptUnitNonMember1v2,
    member1v1Qty: ptQtyMember1v1,
    nonMember1v1Qty: ptQtyNonMember1v1,
    member1v2Qty: ptQtyMember1v2,
    nonMember1v2Qty: ptQtyNonMember1v2,
  });

  const ptActiveSubtotal = calcSubtotal(ptActivePreset.unit, ptActivePreset.qty);

  const ptActivePresetUnit = ptActivePreset.unit;
  const ptActivePresetQty = ptActivePreset.qty;

  const ptTotalWithTax = calcTotalWithTax(ptActiveSubtotal);
  const ptTaxAfterAdjust = calcTax(ptActiveSubtotal);
  const ptAfterCredit = calcAfterCredit(ptTotalWithTax, ptCredit);
  const ptFinalTotal = ptAfterCredit;
  const ptReportDate = new Date().toLocaleDateString("en-CA");

  return {
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
    ptCalcMember1v1,
    ptCalcNonMember1v1,
    ptCalcMember1v2,
    ptCalcNonMember1v2,
    ptActiveLabel,
    ptActivePresetUnit,
    ptActivePresetQty,
    ptActiveSubtotal,
    ptAfterCredit,
    ptTaxAfterAdjust,
    ptFinalTotal,
    ptReportDate,
  };
}
