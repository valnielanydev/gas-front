import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

interface ProfileDetailHeaderProps {
  title: string;
}

export function ProfileDetailHeader({ title }: ProfileDetailHeaderProps) {
  return (
    <div className="flex items-center gap-1 px-3.5 pb-3 pt-2">
      <Link
        to="/customer/profile"
        aria-label="Voltar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent/60"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-[19px] font-bold tracking-tight text-foreground">
        {title}
      </h1>
    </div>
  );
}
