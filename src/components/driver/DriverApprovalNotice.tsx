import { Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DriverApprovalStatus } from "@/types/driver";

export function DriverApprovalNotice({ status }: { status: DriverApprovalStatus }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          {status === "pending" ? "Aguardando aprovação da revendedora" : "Conta inativa"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "pending"
            ? "Você será notificado assim que sua conta for aprovada."
            : "Entre em contato com a revendedora."}
        </p>
      </CardContent>
    </Card>
  );
}
