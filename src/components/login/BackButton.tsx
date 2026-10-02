import { ArrowLeft } from "lucide-react";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-200"
    >
      <ArrowLeft size={16} />
      Voltar
    </button>
  );
}
