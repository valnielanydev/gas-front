import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Loader2, Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/common/useConfirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDeleteProduct, useResellerProducts, useSaveProduct } from "@/queries/reseller.queries";
import type { Product } from "@/types/reseller";
import { useAuth } from "@/auth/AuthProvider";
import { fmtMoney } from "@/lib/constants";

export const Route = createFileRoute("/app/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const { resellerId } = useAuth();
  const { confirm, confirmDialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", is_available: true });

  const { data: products, isLoading } = useResellerProducts(resellerId);

  const upsertMutation = useSaveProduct(resellerId, {
    onSuccess: (_data, { id }) => {
      toast.success(id ? "Produto atualizado" : "Produto criado");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const saveProduct = () =>
    upsertMutation.mutate({
      id: editing?.id ?? null,
      payload: {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        is_available: form.is_available,
      },
    });

  const deleteMutation = useDeleteProduct(resellerId, {
    onSuccess: () => toast.success("Produto removido"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const reset = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", is_available: true });
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      is_available: p.is_available,
    });
    setOpen(true);
  };

  if (!resellerId) {
    return <p className="text-muted-foreground">Sem revendedora vinculada.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie o catálogo da sua revendedora</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Botijão de gás 13kg"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="avail">Disponível para venda</Label>
                <Switch
                  id="avail"
                  checked={form.is_available}
                  onCheckedChange={(v) => setForm({ ...form, is_available: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={saveProduct}
                disabled={!form.name || !form.price || upsertMutation.isPending}
              >
                {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !products?.length ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{fmtMoney(Number(p.price))}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_available ? "default" : "secondary"}>
                      {p.is_available ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Remover "${p.name}"?`,
                          description: "O produto deixa de aparecer para os clientes.",
                          confirmLabel: "Remover",
                          destructive: true,
                        });
                        if (ok) deleteMutation.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
