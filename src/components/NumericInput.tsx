import { useEffect, useState } from "react";

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  fallback?: number;
  inputMode?: "numeric" | "decimal";
  className?: string;
  ariaLabel?: string;
}

export function NumericInput({
  value,
  onChange,
  min,
  max,
  step,
  fallback = 0,
  inputMode = "numeric",
  className,
  ariaLabel,
}: NumericInputProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [focused, value]);

  const commit = (nextDraft: string) => {
    const parsed = Number(nextDraft);
    if (Number.isNaN(parsed)) return;

    let next = parsed;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    onChange(next);
  };

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      inputMode={inputMode}
      max={max}
      min={min}
      pattern={inputMode === "numeric" ? "[0-9]*" : undefined}
      step={step}
      type="text"
      value={draft}
      onBlur={() => {
        setFocused(false);
        if (draft.trim() === "") {
          const fallbackValue = Math.min(max ?? fallback, Math.max(min ?? fallback, fallback));
          setDraft(String(fallbackValue));
          onChange(fallbackValue);
          return;
        }
        commit(draft);
      }}
      onChange={(event) => {
        const nextDraft = event.target.value;
        if (nextDraft !== "" && !/^\d*\.?\d*$/.test(nextDraft)) return;
        setDraft(nextDraft);
        if (nextDraft !== "") commit(nextDraft);
      }}
      onFocus={() => {
        setFocused(true);
        if (Number(draft) === 0) {
          setDraft("");
        }
      }}
    />
  );
}
