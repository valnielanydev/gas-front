import { createFileRoute } from "@tanstack/react-router";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";

export const Route = createFileRoute("/customer/profile/ajuda")({
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Ajuda" />
      <div className="px-5 pt-1">
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          Central de ajuda, perguntas frequentes e contato com o suporte.
        </p>
      </div>
    </div>
  );
}
