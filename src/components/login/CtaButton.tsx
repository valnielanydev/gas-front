import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CtaButtonProps {
  ready: boolean;
  loading: boolean;
  children: ReactNode;
}

export function CtaButton({ ready, loading, children }: CtaButtonProps) {
  return (
    <button
      type="submit"
      disabled={!ready || loading}
      className={cn(
        "mt-1.5 flex h-14.5 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold tracking-[0.2px] transition-all duration-200",
        ready
          ? "cursor-pointer bg-linear-to-b from-blue-500 to-blue-600 text-[#04130d] shadow-[0_12px_26px_rgba(37,99,235,0.35)] active:scale-[0.98]"
          : "cursor-default bg-white/8 text-white/40",
      )}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}
