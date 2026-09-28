import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResellerCredentialsDialog } from "@/components/admin/ResellerCredentialsDialog";
import {
  ResellerFormDialog,
  type ResellerCredentials,
} from "@/components/admin/ResellerFormDialog";
import { ResellersTable } from "@/components/admin/ResellersTable";
import {
  useAdminResellers,
  useDeleteReseller,
  useToggleResellerActive,
} from "@/queries/admin.queries";
import type { AdminReseller } from "@/types/admin";

export const Route = createFileRoute("/master/resellers")({
  component: ResellersPage,
});

function ResellersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminReseller | null>(null);
  // Bumped on every open so the form remounts with fresh state
  const [formKey, setFormKey] = useState(0);
  const [credentials, setCredentials] = useState<ResellerCredentials | null>(null);

  const { data: resellers, isLoading } = useAdminResellers();

  const toggleActive = useToggleResellerActive({
    onSuccess: () => toast.success("Status atualizado"),
    onError: (e) => toast.error(e.message || "Erro ao atualizar status"),
  });

  const deleteMutation = useDeleteReseller({
    onSuccess: () => toast.success("Revendedora removida"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const openForm = (reseller: AdminReseller | null) => {
    setEditing(reseller);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revendedoras</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as revendedoras da plataforma
          </p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="mr-2 h-4 w-4" /> Nova
        </Button>
      </div>

      <ResellerFormDialog
        key={formKey}
        open={formOpen}
        reseller={editing}
        onOpenChange={setFormOpen}
        onCreated={setCredentials}
      />
      <ResellerCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !resellers?.length ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma revendedora cadastrada</p>
          </div>
        ) : (
          <ResellersTable
            resellers={resellers}
            onEdit={openForm}
            onToggleActive={(r) => toggleActive.mutate(r)}
            onDelete={(r) => deleteMutation.mutate(r.id)}
          />
        )}
      </div>
    </div>
  );
}
