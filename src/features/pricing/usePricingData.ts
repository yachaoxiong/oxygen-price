/* cSpell:words supabase */

import { useEffect, useState } from "react";

import { fetchPricingItems } from "@/lib/supabase";
import type { PricingItem } from "@/types/pricing";

export function usePricingData(authState: "loading" | "authed" | "guest") {
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);

  useEffect(() => {
    if (authState !== "authed") return;
    let mounted = true;

    async function loadData() {
      try {
        const items = await fetchPricingItems();
        if (!mounted) return;
        setPricingItems(items);
      } catch {
        if (!mounted) return;
        setPricingItems([]);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [authState]);

  return { pricingItems };
}
