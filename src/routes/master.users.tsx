import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/master/users")({
  component: UsersPage,
});

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  roles: string[];
  reseller_id: string | null;
  reseller_name: string | null;
}

interface Reseller {
  id: string;
  name: string;
}

function UsersPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [linkOpen, setLinkOpen] = useState<string | null>(null);
  const [linkResellerId, setLinkResellerId] = useState<string>("");
  const [linkRole, setLinkRole] = useState<"reseller_admin" | "driver">("reseller_admin");

  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => adminService.users<UserRow>(),
  });

  const { data: resellers } = useQuery({
    queryKey: ["resellers-list"],
    queryFn: () => adminService.resellers<Reseller>({ active: true }),
  });

  const promoteMaster = useMutation({
    mutationFn: (userId: string) => adminService.promoteToMaster(userId),
    onSuccess: () => {
      toast.success("Usuário promovido a Master");
      qc.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const demoteMaster = useMutation({
    mutationFn: (userId: string) => adminService.demoteFromMaster(userId),
    onSuccess: () => {
      toast.success("Permissão Master removida");
      qc.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const linkToReseller = useMutation({
    mutationFn: (userId: string) =>
      adminService.linkUserToReseller(userId, linkResellerId, linkRole),
    onSuccess: () => {
      toast.success("Vínculo criado");
      qc.invalidateQueries({ queryKey: ["all-users"] });
      setLinkOpen(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie permissões e vínculos com revendedoras
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead className="hidden md:table-cell">Revendedora</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{u.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant={r === "master" ? "default" : "secondary"}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{u.reseller_name || "—"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {!u.roles.includes("master") ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Promover ${u.full_name || "usuário"} a Master?`))
                            promoteMaster.mutate(u.id);
                        }}
                      >
                        <Shield className="mr-1 h-3 w-3" /> Master
                      </Button>
                    ) : (
                      u.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remover permissão Master de ${u.full_name || "usuário"}?`))
                              demoteMaster.mutate(u.id);
                          }}
                        >
                          <ShieldOff className="mr-1 h-3 w-3" /> Despromover
                        </Button>
                      )
                    )}
                    {!u.reseller_id && (
                      <Dialog
                        open={linkOpen === u.id}
                        onOpenChange={(v) => setLinkOpen(v ? u.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Vincular
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Vincular a uma revendedora</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label>Revendedora</Label>
                              <Select value={linkResellerId} onValueChange={setLinkResellerId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {resellers?.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Papel</Label>
                              <Select
                                value={linkRole}
                                onValueChange={(v) => setLinkRole(v as "reseller_admin" | "driver")}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="reseller_admin">
                                    Admin da Revendedora
                                  </SelectItem>
                                  <SelectItem value="driver">Motorista</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => linkToReseller.mutate(u.id)}
                              disabled={!linkResellerId || linkToReseller.isPending}
                            >
                              {linkToReseller.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Vincular
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
