import { createFileRoute } from "@tanstack/react-router";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";

export const Route = createFileRoute("/customer/profile/notificacoes")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Notificações" />
      <div className="px-5 pt-1">
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          Decida o que quer receber: status de pedidos, promoções e novidades.
        </p>
      </div>
    </div>
  );
}
