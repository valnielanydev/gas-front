import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  trailing?: ReactNode;
  autoComplete?: string;
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  trailing,
  autoComplete,
}: FieldProps) {
  return (
    <label className="group block">
      <span className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-400 transition-colors duration-180 group-focus-within:text-sky-400">
        {label}
      </span>
      <div className="flex h-14.5 items-center gap-2.5 rounded-2xl border border-slate-800 bg-[#0f172a] px-4 transition-all duration-180 focus-within:border-blue-600/60 focus-within:bg-slate-800/80 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] font-semibold tracking-[0.3px] text-slate-200 outline-none placeholder:font-normal placeholder:text-slate-600"
        />
        {trailing}
      </div>
    </label>
  );
}
