import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

/**
 * IME-safe single-line input.
 * - Holds a local buffer while the user is composing (Japanese/Chinese IME).
 * - Commits only on compositionend or on non-composing input changes.
 * - Prevents duplicate input caused by controlled-value re-renders mid-composition.
 */
export function IMEInput({ value, onChange, className, placeholder, inputMode, onClick }: Props) {
  const [local, setLocal] = useState(value);
  const composingRef = useRef(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!composingRef.current) setLocal(value);
  }, [value]);

  return (
    <input
      ref={ref}
      className={className}
      placeholder={placeholder}
      inputMode={inputMode}
      value={local}
      onClick={onClick}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        const v = (e.target as HTMLInputElement).value;
        setLocal(v);
        onChange(v);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (!composingRef.current) onChange(v);
      }}
      onBlur={() => {
        if (local !== value) onChange(local);
      }}
    />
  );
}
