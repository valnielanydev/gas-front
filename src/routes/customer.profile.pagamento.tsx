import { createFileRoute } from "@tanstack/react-router";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";

export const Route = createFileRoute("/customer/profile/pagamento")({
  component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Formas de pagamento" />
      <div className="px-5 pt-1">
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          Cadastre cartões, Pix e veja seus métodos de pagamento. Tudo protegido e criptografado.
        </p>
      </div>
    </div>
  );
}
