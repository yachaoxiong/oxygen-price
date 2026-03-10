export function getMembershipRank(nameZh: string) {
  if (/日|day/i.test(nameZh)) return 0;
  if (/周|week/i.test(nameZh)) return 1;
  if (/月|month/i.test(nameZh)) return 2;
  if (/年|year|annual/i.test(nameZh)) return 3;
  return 4;
}

export function getCycleRankFromProgram(program: string) {
  const matched = program.match(/(\d+)/);
  if (!matched) return Number.MAX_SAFE_INTEGER;
  return Number(matched[1]);
}

export function displayMode(mode?: string) {
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

export function getModeSortRank(mode?: string) {
  if (!mode) return 99;
  if (mode === "single") return 0;
  if (mode === "weekly_pass") return 1;
  if (mode === "monthly_pass") return 2;
  return 99;
}

export function getGroupClassDays(mode?: string) {
  if (mode === "weekly_pass") return 7;
  if (mode === "monthly_pass") return 30;
  return null;
}
