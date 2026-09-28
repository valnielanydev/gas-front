import { useState } from "react";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/common/useConfirm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminReseller } from "@/types/admin";

interface Props {
  resellers: AdminReseller[];
  onEdit: (reseller: AdminReseller) => void;
  onToggleActive: (reseller: AdminReseller) => void;
  onDelete: (reseller: AdminReseller) => void;
}

export function ResellersTable({ resellers, onEdit, onToggleActive, onDelete }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const copyCode = async (r: AdminReseller) => {
    await navigator.clipboard.writeText(r.invite_code);
    setCopiedId(r.id);
    toast.success(`Código ${r.invite_code} copiado`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {confirmDialog}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Código</TableHead>
            <TableHead className="hidden md:table-cell">Cidade/UF</TableHead>
            <TableHead className="hidden lg:table-cell">Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resellers.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>
                <button
                  onClick={() => copyCode(r)}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 font-mono text-xs font-semibold tracking-wider hover:bg-muted transition-colors"
                  title="Copiar código"
                >
                  {r.invite_code}
                  {copiedId === r.id ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {r.city ? `${r.city}/${r.state ?? "-"}` : "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">{r.phone ?? "—"}</TableCell>
              <TableCell>
                <button onClick={() => onToggleActive(r)}>
                  <Badge variant={r.is_active ? "default" : "secondary"}>
                    {r.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </button>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Remover "${r.name}"?`,
                      description: "A revendedora e seus vínculos serão removidos.",
                      confirmLabel: "Remover",
                      destructive: true,
                    });
                    if (ok) onDelete(r);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
