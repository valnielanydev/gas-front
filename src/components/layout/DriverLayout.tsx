import type { ReactNode } from "react";
import { DriverBottomNav } from "@/components/layout/DriverBottomNav";
import { DriverNavigation } from "@/components/layout/DriverNavigation";
import { cn } from "@/lib/utils";

interface DriverLayoutProps {
  children: ReactNode;
  contentClassName?: string;
}

export function DriverLayout({ children, contentClassName }: DriverLayoutProps) {
  return (
    <DriverNavigation>
      <div className="min-h-screen bg-muted pb-20 md:pb-0">
        <div className={cn("mx-auto w-full max-w-2xl space-y-4 p-4", contentClassName)}>
          {children}
        </div>
        <DriverBottomNav />
      </div>
    </DriverNavigation>
  );
}
