import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { onlyDigits } from "@/lib/utils";
import type { TrackingReseller } from "@/types/order";

interface Props {
  reseller: TrackingReseller | null;
  onBack: () => void;
}

export function OrderExpiredCard({ reseller, onBack }: Props) {
  return (
    <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-900/10">
      <CardContent className="space-y-3 p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-amber-700">
          <Clock className="h-5 w-5" />
          <span className="font-semibold">Não encontramos motorista disponível no momento.</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Você pode entrar em contato direto com a revendedora para concluir o pedido.
        </p>
        {reseller?.phone ? (
          <a
            href={`tel:${onlyDigits(reseller.phone)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            📞 Ligar para {reseller.name ?? "revendedora"}
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">Telefone da revendedora indisponível.</p>
        )}
        <Button variant="outline" className="w-full" onClick={onBack}>
          Voltar para início
        </Button>
      </CardContent>
    </Card>
  );
}
