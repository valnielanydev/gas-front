import type { ReactNode } from "react";

interface ProfileSectionProps {
  label?: string;
  children: ReactNode;
}

export function ProfileSection({ label, children }: ProfileSectionProps) {
  return (
    <section>
      {label && (
        <h2 className="px-5 pb-1.5 pt-4 text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground/80">
          {label}
        </h2>
      )}
      <div className="mx-4 divide-y divide-border overflow-hidden rounded-[1.125rem] border bg-card">
        {children}
      </div>
    </section>
  );
}
