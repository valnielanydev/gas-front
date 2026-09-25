import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileDetailHeader } from "@/components/customer/ProfileDetailHeader";
import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/integrations/api/client";
import { customerService } from "@/services/customer.service";
import { formatPhone } from "@/lib/phone";
import { onlyDigits } from "@/lib/utils";
import { optionalPhoneSchema } from "@/lib/validation";

export const Route = createFileRoute("/customer/profile/dados-pessoais")({
  component: PersonalDataPage,
});

const profileSchema = z.object({
  fullName: z
    .string()
    .refine((v) => !v.trim() || v.trim().length >= 2, "Nome deve ter ao menos 2 caracteres"),
  phone: optionalPhoneSchema,
});

type ProfileErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

function PersonalDataPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(formatPhone(user?.phone ?? ""));
  const cpf = user?.cpf ?? "";

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
      await customerService.updateProfile({
        name: fullName.trim() || null,
        phone: onlyDigits(phone) || null,
      });
      await refresh();
      toast.success("Alterações salvas");
      navigate({ to: "/customer/profile" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <ProfileDetailHeader title="Dados pessoais" />
      <div className="px-5 pt-1">
        <div className="mb-4.5">
          <Label className="mb-2 block text-[13px] font-bold text-muted-foreground">
            Nome completo
          </Label>
          <Input
            value={fullName}
            aria-invalid={!!errors.fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setErrors((p) => ({ ...p, fullName: undefined }));
            }}
          />
          {errors.fullName && <p className="mt-1.5 text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="mb-4.5">
          <Label className="mb-2 block text-[13px] font-bold text-muted-foreground">Telefone</Label>
          <Input
            value={phone}
            inputMode="tel"
            aria-invalid={!!errors.phone}
            onChange={(e) => {
              setPhone(formatPhone(e.target.value));
              setErrors((p) => ({ ...p, phone: undefined }));
            }}
            placeholder="(11) 98877-1020"
          />
          {errors.phone && <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div className="mb-6">
          <Label className="mb-2 block text-[13px] font-bold text-muted-foreground">CPF</Label>
          <Input value={cpf} disabled />
          <p className="mt-1.5 text-xs text-muted-foreground">O CPF não pode ser alterado.</p>
        </div>

        <Button onClick={save} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
