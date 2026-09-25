import { ChevronRight, Home } from "lucide-react";

const summarizeAddress = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ") || value;

interface Props {
  address: string;
  label?: string | null;
  onClick: () => void;
}

export function LastAddressButton({ address, label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-3xl border bg-card/85 p-3.5 text-left shadow-sm transition active:scale-[0.99] hover:border-primary/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Home className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{label ?? "Último endereço"}</div>
        <div className="truncate text-xs text-muted-foreground">{summarizeAddress(address)}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
