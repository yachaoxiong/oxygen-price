"use client";

import { useEffect, useState } from "react";

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  allowEmpty?: boolean;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  ariaLabel?: string;
  onBlur?: () => void;
};

const normalizeNumberString = (raw: string, allowDecimal: boolean) => {
  if (raw === "") return "";

  let cleaned = raw;
  if (allowDecimal) {
    const [head, ...rest] = cleaned.split(".");
    cleaned = head + (rest.length ? `.${rest.join("")}` : "");
  } else {
    cleaned = cleaned.replace(/\./g, "");
  }

  const [intPart, decimalPart] = cleaned.split(".");
  const normalizedInt = intPart.replace(/^0+(?=\d)/, "");
  const safeInt = normalizedInt === "" ? "0" : normalizedInt;

  if (!allowDecimal || decimalPart === undefined || decimalPart === "") {
    return safeInt;
  }

  return `${safeInt}.${decimalPart}`;
};

const sanitizeInput = (
  raw: string,
  allowDecimal: boolean,
  allowNegative: boolean,
) => {
  const allowed = allowDecimal ? /[^\d.-]/g : /[^\d-]/g;
  let cleaned = raw.replace(allowed, "");

  if (!allowNegative) {
    cleaned = cleaned.replace(/-/g, "");
  } else if (cleaned.includes("-")) {
    cleaned = cleaned.replace(/(?!^)-/g, "");
  }

  if (allowDecimal) {
    const [head, ...rest] = cleaned.split(".");
    cleaned = head + (rest.length ? `.${rest.join("")}` : "");
  }

  return cleaned;
};

const toNumber = (raw: string, allowDecimal: boolean) => {
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return 0;
  const parsed = allowDecimal ? Number(raw) : Number(raw.replace(/\./g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const clampValue = (value: number, min?: number, max?: number) => {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
};

export function NumberInput({
  value,
  onChange,
  className,
  min,
  max,
  allowDecimal = true,
  allowNegative = false,
  allowEmpty = false,
  placeholder,
  inputMode,
  ariaLabel,
  onBlur,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(() =>
    allowEmpty && value === 0 ? "" : String(value),
  );

  useEffect(() => {
    setDisplayValue(allowEmpty && value === 0 ? "" : String(value));
  }, [allowEmpty, value]);

  return (
    <input
      type="text"
      inputMode={inputMode ?? (allowDecimal ? "decimal" : "numeric")}
      className={className}
      value={displayValue}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === "" && allowEmpty) {
          setDisplayValue("");
          onChange(clampValue(0, min, max));
          return;
        }
        let cleaned = sanitizeInput(raw, allowDecimal, allowNegative);
        if (displayValue === "0" && /^0\d/.test(cleaned)) {
          cleaned = cleaned.replace(/^0+/, "");
        }
        setDisplayValue(cleaned);
        const parsed = clampValue(toNumber(cleaned, allowDecimal), min, max);
        onChange(parsed);
      }}
      onBlur={() => {
        if (displayValue === "" && allowEmpty) {
          onBlur?.();
          return;
        }
        const normalized = normalizeNumberString(displayValue, allowDecimal);
        const parsed = clampValue(toNumber(normalized, allowDecimal), min, max);
        const nextDisplay = allowEmpty && parsed === 0 ? "" : String(parsed);
        setDisplayValue(nextDisplay);
        onChange(parsed);
        onBlur?.();
      }}
    />
  );
}
