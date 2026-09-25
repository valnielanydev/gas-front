import { Card, CardContent } from "@/components/ui/card";

export function DeliveryCodeCard({ code }: { code: string }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Código de entrega</p>
        <div className="text-4xl font-bold tracking-[0.4em] text-primary">{code}</div>
        <p className="text-xs text-muted-foreground">
          Informe este código ao motorista no momento da entrega.
        </p>
      </CardContent>
    </Card>
  );
}
