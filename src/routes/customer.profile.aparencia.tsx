import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/customer/profile/aparencia")({
  component: AppearancePage,
});

function AppearancePage() {
  const { theme, followSystem, setTheme, setPreference } = useTheme();

  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Aparência" />
      <div className="px-5 pt-1">
        <p className="mb-4 text-[14.5px] leading-relaxed text-muted-foreground">
          Escolha como o app aparece pra você.
        </p>

        <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-3.5">
          <span className="text-[15px] font-semibold text-foreground">Tema escuro</span>
          <Switch
            checked={theme === "dark"}
            disabled={followSystem}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Tema escuro"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-3.5">
          <span className="text-[15px] font-semibold text-foreground">Acompanhar o sistema</span>
          <Switch
            checked={followSystem}
            onCheckedChange={(checked) => setPreference(checked ? "system" : theme)}
            aria-label="Acompanhar o sistema"
          />
        </div>
      </div>
    </div>
  );
}
