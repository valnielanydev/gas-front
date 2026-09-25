import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DriverLayout } from "@/components/DriverLayout";
import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/integrations/api/client";
import { driverService } from "@/services/driver.service";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  phone: z.string().refine((v) => {
    if (!v.trim()) return true;
    const d = v.replace(/\D/g, "");
    return d.length >= 10 && d.length <= 11;
  }, "Telefone inválido — informe DDD + número"),
  avatarUrl: z.string().refine((v) => {
    if (!v.trim()) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }, "URL da foto inválida"),
});

type ProfileErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

export const Route = createFileRoute("/driver/profile")({ component: DriverProfilePage });

interface DriverProfile {
  fullName: string;
  phone: string;
  avatarUrl: string;
  notes: string;
  additionalInfo: string;
  approvalStatus: string;
  resellerName: string;
}

function DriverProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [resellerName, setResellerName] = useState("—");
  const [approvalStatus, setApprovalStatus] = useState("—");

  useEffect(() => {
    if (!user) return;
    driverService
      .myProfile<DriverProfile>()
      .then((data) => {
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
        setNotes(data.notes ?? "");
        setAdditionalInfo(data.additionalInfo ?? "");
        setApprovalStatus(data.approvalStatus ?? "—");
        setResellerName(data.resellerName ?? "—");
      })
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Erro ao carregar perfil"),
      )
      .finally(() => setLoading(false));
  }, [user]);

  const onSave = async () => {
    const result = profileSchema.safeParse({ phone, avatarUrl });
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
      await driverService.updateMyProfile({
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        notes: notes.trim() || null,
        additionalInfo: additionalInfo.trim() || null,
      });
      toast.success("Perfil atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate({ to: "/" });
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return (
    <DriverLayout>
      <h1 className="text-xl font-bold">Meu perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados editáveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome (definido pela revendedora)</Label>
            <Input value={fullName} readOnly disabled />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={phone}
              aria-invalid={!!errors.phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div>
            <Label>Foto (URL)</Label>
            <Input
              value={avatarUrl}
              aria-invalid={!!errors.avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setErrors((p) => ({ ...p, avatarUrl: undefined }));
              }}
            />
            {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl}</p>}
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label>Informações adicionais</Label>
            <Input value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dados da revendedora (somente leitura)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Revendedora vinculada: <strong>{resellerName}</strong>
          </p>
          <p>
            Status: <strong>{approvalStatus}</strong>
          </p>
        </CardContent>
      </Card>
      <ChangePasswordDialog
        trigger={
          <Button variant="outline" className="w-full">
            Alterar senha
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle variant="full" />
        </CardContent>
      </Card>
      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </DriverLayout>
  );
}
