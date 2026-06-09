import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Save, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api, ApiError } from "@/integrations/api/client";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z
    .string()
    .refine((v) => !v.trim() || v.trim().length >= 2, "Nome deve ter ao menos 2 caracteres"),
  phone: z.string().refine((v) => {
    if (!v.trim()) return true;
    const d = v.replace(/\D/g, "");
    return d.length >= 10 && d.length <= 11;
  }, "Telefone inválido — informe DDD + número"),
});

type ProfileErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

export const Route = createFileRoute("/customer/profile")({
  component: CustomerProfile,
});

interface CustomerProfileData {
  fullName: string;
  phone: string;
  cpf: string;
}

function CustomerProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get<CustomerProfileData>("/customers/me/profile")
      .then((data) => {
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
        setCpf(data.cpf ?? "");
      })
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Erro ao carregar perfil"),
      )
      .finally(() => setLoading(false));
  }, [user]);

  const save = async () => {
    const result = profileSchema.safeParse({ fullName, phone });
    if (!result.success) {
      const fieldErrors: ProfileErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await api.patch("/customers/me/profile", {
        fullName: fullName.trim() || null,
        phone: phone.trim() || null,
      });
      toast.success("Dados atualizados");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{fullName || "Meu perfil"}</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Nome completo</Label>
            <Input
              value={fullName}
              aria-invalid={!!errors.fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((p) => ({ ...p, fullName: undefined }));
              }}
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input
              value={phone}
              aria-invalid={!!errors.phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="(00) 00000-0000"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1">
            <Label>CPF</Label>
            <Input value={cpf} disabled />
            <p className="text-[11px] text-muted-foreground">CPF não pode ser alterado.</p>
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordDialog
            trigger={
              <Button variant="outline" className="w-full justify-start">
                Alterar senha
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle variant="full" />
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" /> Sair da conta
      </Button>
    </div>
  );
}
