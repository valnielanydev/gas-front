import { Check, History, Pencil, Power, PowerOff, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DriverApprovalStatus, ResellerDriver } from "@/types/driver";

interface Props {
  drivers: ResellerDriver[];
  tab: DriverApprovalStatus;
  statusPending: boolean;
  onSetStatus: (driver: ResellerDriver, status: DriverApprovalStatus) => void;
  onDeactivate: (driver: ResellerDriver) => void;
  onShowHistory: (driver: ResellerDriver) => void;
  onEdit: (driver: ResellerDriver) => void;
  onRemove: (driver: ResellerDriver) => void;
}

export function DriversTable({
  drivers,
  tab,
  statusPending,
  onSetStatus,
  onDeactivate,
  onShowHistory,
  onEdit,
  onRemove,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="hidden md:table-cell">Telefone</TableHead>
          <TableHead className="hidden md:table-cell">Veículo</TableHead>
          <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
          {tab === "active" && <TableHead className="hidden sm:table-cell">Entregas</TableHead>}
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.map((d) => (
          <TableRow key={d.id}>
            <TableCell>
              <div className="font-medium">{d.full_name || "—"}</div>
              {d.document && <div className="text-xs text-muted-foreground">Doc: {d.document}</div>}
            </TableCell>
            <TableCell className="hidden md:table-cell">{d.phone || "—"}</TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="text-sm">
                {d.vehicle_plate || "—"}
                {d.vehicle_type && (
                  <div className="text-xs text-muted-foreground">
                    {d.vehicle_type}
                    {d.vehicle_model ? ` · ${d.vehicle_model}` : ""}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
              {new Date(d.created_at).toLocaleDateString("pt-BR")}
            </TableCell>
            {tab === "active" && (
              <TableCell className="hidden sm:table-cell">
                <span className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {Number(d.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>{d.total_deliveries}</span>
                </span>
              </TableCell>
            )}
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {tab === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onSetStatus(d, "active")}
                      disabled={statusPending}
                    >
                      <Check className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetStatus(d, "inactive")}
                      disabled={statusPending}
                    >
                      <X className="h-4 w-4" />
                      Rejeitar
                    </Button>
                  </>
                )}
                {tab === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeactivate(d)}
                    disabled={statusPending}
                  >
                    <PowerOff className="h-4 w-4" />
                    Inativar
                  </Button>
                )}
                {tab === "inactive" && (
                  <Button
                    size="sm"
                    onClick={() => onSetStatus(d, "active")}
                    disabled={statusPending}
                  >
                    <Power className="h-4 w-4" />
                    Ativar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Histórico"
                  onClick={() => onShowHistory(d)}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Editar" onClick={() => onEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Remover" onClick={() => onRemove(d)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
