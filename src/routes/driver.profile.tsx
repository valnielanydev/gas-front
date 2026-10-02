import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DriverLayout } from "@/components/layout/DriverLayout";
import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/integrations/api/client";
import { useMyDriverProfile, useUpdateMyDriverProfile } from "@/queries/driver.queries";
import type { DriverProfile } from "@/types/driver";
import { toast } from "sonner";
import { z } from "zod";
import { fieldErrors, optionalPhoneSchema } from "@/lib/validation";
import { getApprovalStatusLabel } from "@/i18n/ptBR";

const profileSchema = z.object({
  phone: optionalPhoneSchema,
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

function DriverProfilePage() {
  const { user } = useAuth();
  const { data, error, refetch, isFetching } = useMyDriverProfile(user?.id);

  if (error) {
    // No form here: saving an empty form would overwrite the stored data with blanks
    return (
      <DriverLayout>
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {error instanceof ApiError ? error.message : "Não foi possível carregar seu perfil."}
            </p>
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </DriverLayout>
    );
  }

  if (!data)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  return <DriverProfileForm profile={data} />;
}

function DriverProfileForm({ profile }: { profile: DriverProfile }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [phone, setPhone] = useState(profile.phone ?? "");
  const fullName = profile.fullName ?? "";
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [notes, setNotes] = useState(profile.notes ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(profile.additionalInfo ?? "");
  const resellerName = profile.resellerName ?? "—";
  const approvalStatus = profile.approvalStatus
    ? getApprovalStatusLabel(profile.approvalStatus)
    : "—";

  const updateProfile = useUpdateMyDriverProfile(user?.id, {
    onSuccess: () => toast.success("Perfil atualizado."),
    onError: (e) => toast.error(e.message || "Erro ao salvar"),
  });
  const saving = updateProfile.isPending;

  const onSave = () => {
    const result = profileSchema.safeParse({ phone, avatarUrl });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    updateProfile.mutate({
      phone: phone.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
      notes: notes.trim() || null,
      additionalInfo: additionalInfo.trim() || null,
    });
  };

  const handleLogout = () => {
    signOut();
    navigate({ to: "/" });
  };

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
