import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriverDashboardData } from "@/types/driver";

interface Props {
  loading: boolean;
  dashboard: DriverDashboardData | null;
  isOnline: boolean;
  hasActiveOrder: boolean;
}

export function DriverDashboardCards({ loading, dashboard, isOnline, hasActiveOrder }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-muted-foreground">Hoje</div>
            <div className="font-bold">{dashboard?.ordersToday ?? 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Semana</div>
            <div className="font-bold">{dashboard?.ordersWeek ?? 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Mês</div>
            <div className="font-bold">{dashboard?.ordersMonth ?? 0}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Qualidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div>
            Avaliação média: <strong>{dashboard?.avgRating?.toFixed(1) ?? "—"}</strong>
          </div>
          <div>
            Taxa de aceitação:{" "}
            <strong>
              {dashboard?.acceptanceRate != null ? `${dashboard.acceptanceRate.toFixed(0)}%` : "—"}
            </strong>
          </div>
          <div>
            Cancelamentos: <strong>{dashboard?.cancellations ?? 0}</strong>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 text-xs">
          <Badge variant={isOnline ? "default" : "outline"}>Disponível</Badge>
          <Badge variant={hasActiveOrder ? "default" : "outline"}>Em rota</Badge>
          <Badge variant={!isOnline ? "secondary" : "outline"}>Offline</Badge>
        </CardContent>
      </Card>
    </>
  );
}
