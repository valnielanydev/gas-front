import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const profileRowClassName =
  "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors duration-100 hover:bg-accent/60 active:bg-accent/60";

interface ProfileRowContentProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  destructive?: boolean;
  chevron?: boolean;
  trailing?: ReactNode;
}

export function ProfileRowContent({
  icon: Icon,
  title,
  subtitle,
  meta,
  badge,
  destructive = false,
  chevron = true,
  trailing,
}: ProfileRowContentProps) {
  return (
    <>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center",
          destructive ? "text-destructive" : "text-foreground",
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[15px] font-semibold tracking-tight",
            destructive ? "text-destructive" : "text-foreground",
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
      {meta && (
        <span className="shrink-0 text-[13px] font-semibold text-muted-foreground">{meta}</span>
      )}
      {badge && (
        <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
          {badge}
        </span>
      )}
      {trailing}
      {chevron && (
        <ChevronRight
          className="h-[18px] w-[18px] shrink-0 text-muted-foreground/70"
          strokeWidth={2}
        />
      )}
    </>
  );
}

interface ProfileRowProps extends ProfileRowContentProps {
  to?: string;
  onClick?: () => void;
}

export function ProfileRow({ to, onClick, ...content }: ProfileRowProps) {
  if (to) {
    return (
      <Link to={to} className={profileRowClassName}>
        <ProfileRowContent {...content} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={profileRowClassName}>
      <ProfileRowContent {...content} />
    </button>
  );
}
