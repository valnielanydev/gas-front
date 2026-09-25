import { createFileRoute } from "@tanstack/react-router";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";

export const Route = createFileRoute("/customer/profile/enderecos")({
  component: AddressesPage,
});

function AddressesPage() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Endereços" />
      <div className="px-5 pt-1">
        <p className="text-[14.5px] leading-relaxed text-muted-foreground">
          Aqui você gerencia seus endereços salvos — casa, trabalho e outros — para receber os
          pedidos mais rápido.
        </p>
      </div>
    </div>
  );
}
