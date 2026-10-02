import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}

export function RoleCard({ active, onClick, label, icon }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-sm font-bold tracking-[0.1px] transition-all duration-160 cursor-pointer",
        active
          ? "border-blue-600/60 bg-blue-600/12 text-blue-400"
          : "border-slate-800 bg-white/4 text-slate-300/75",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
