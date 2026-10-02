import { Flame, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Props {
  subtitle: string;
  isApproved: boolean;
  isOnline: boolean;
  /** Disables the online switch (e.g. while toggling or during a delivery). */
  toggleDisabled: boolean;
  onToggleOnline: (next: boolean) => void;
}

export function DriverHeader({
  subtitle,
  isApproved,
  isOnline,
  toggleDisabled,
  onToggleOnline,
}: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">VaptGás Motorista</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isApproved && (
            <div className="flex items-center gap-2">
              <Power className={`h-4 w-4 ${isOnline ? "text-primary" : "text-muted-foreground"}`} />
              <Switch
                checked={isOnline}
                disabled={toggleDisabled}
                onCheckedChange={onToggleOnline}
                aria-label={isOnline ? "Ficar offline" : "Ficar online"}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
