import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Truck, Loader2, CheckCircle2, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/integrations/api/client";
import { z } from "zod";
import { isValidCpf } from "@/lib/cpf";

const signupSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  phone: z.string().refine((v) => {
    const d = v.replace(/\D/g, "");
    return d.length >= 10 && d.length <= 11;
  }, "Telefone inválido — informe DDD + número"),
  document: z.string().refine(isValidCpf, "CPF inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  vehiclePlate: z
    .string()
    .regex(/^[A-Z]{3}-?[0-9][0-9A-Z][0-9]{2}$/, "Placa inválida (ex: ABC-1234 ou ABC-1D23)"),
  vehicleType: z.string().min(1, "Selecione o tipo de veículo"),
  vehicleModel: z.string().optional(),
});

type SignupErrors = Partial<Record<keyof z.infer<typeof signupSchema>, string>>;

export const Route = createFileRoute("/driver/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  component: DriverSignupPage,
});

type Reseller = { id: string; name: string; city: string | null; state: string | null };

function DriverSignupPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"loading" | "invalid" | "form" | "done">("loading");
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});

  const clearError = (field: keyof SignupErrors) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [document, setDocument] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  // Strip token from URL immediately after TanStack Router reads it, so it doesn't
  // linger in browser history or get captured by server/CDN access logs.
  useEffect(() => {
    if (typeof window !== "undefined") {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setPhase("invalid");
      return;
    }
    let cancelled = false;
    api
      .get<{ valid: boolean; reseller: Reseller }>(
        `/invites/driver/validate?token=${encodeURIComponent(token)}`,
      )
      .then((res) => {
        if (cancelled) return;
        if (!res.valid) {
          setPhase("invalid");
          return;
        }
        setReseller(res.reseller);
        setPhase("form");
      })
      .catch(() => {
        if (!cancelled) setPhase("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse({
      fullName,
      phone,
      document,
      password,
      vehiclePlate,
      vehicleType,
      vehicleModel: vehicleModel || undefined,
    });

    if (!result.success) {
      const fieldErrors: SignupErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignupErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await api.post("/invites/driver/signup", {
        token,
        password,
        fullName,
        phone,
        document,
        vehiclePlate,
        vehicleType,
        vehicleModel: vehicleModel || null,
      });
      setPhase("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-foreground">VaptGás Motoristas</span>
        </Link>

        {phase === "loading" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validando convite…</p>
            </CardContent>
          </Card>
        )}

        {phase === "invalid" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Convite inválido ou expirado</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Para se cadastrar como motorista, peça à revendedora um link de convite válido. Os
                  convites expiram em 24 horas.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === "form" && reseller && (
          <Card>
            <CardHeader>
              <div className="rounded-md bg-primary/10 p-3">
                <p className="text-xs uppercase text-muted-foreground">Você vai atender</p>
                <p className="font-semibold text-foreground">{reseller.name}</p>
                {(reseller.city || reseller.state) && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[reseller.city, reseller.state].filter(Boolean).join(" — ")}
                  </p>
                )}
              </div>
              <CardTitle className="mt-4">Seus dados</CardTitle>
              <CardDescription>
                Após cadastrar, sua conta ficará aguardando aprovação da revendedora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1">
                  <Label htmlFor="fullName">Nome completo *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    aria-invalid={!!errors.fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      clearError("fullName");
                    }}
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    aria-invalid={!!errors.phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearError("phone");
                    }}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="document">
                    CPF * <span className="text-xs text-muted-foreground">(será seu login)</span>
                  </Label>
                  <Input
                    id="document"
                    value={document}
                    aria-invalid={!!errors.document}
                    onChange={(e) => {
                      setDocument(e.target.value);
                      clearError("document");
                    }}
                    placeholder="000.000.000-00"
                  />
                  {errors.document && <p className="text-xs text-destructive">{errors.document}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    aria-invalid={!!errors.password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="vtype">Tipo de veículo *</Label>
                    <Select
                      value={vehicleType}
                      onValueChange={(v) => {
                        setVehicleType(v);
                        clearError("vehicleType");
                      }}
                    >
                      <SelectTrigger id="vtype" aria-invalid={!!errors.vehicleType}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Moto">Moto</SelectItem>
                        <SelectItem value="Carro">Carro</SelectItem>
                        <SelectItem value="Triciclo">Triciclo</SelectItem>
                        <SelectItem value="Bicicleta">Bicicleta</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.vehicleType && (
                      <p className="text-xs text-destructive">{errors.vehicleType}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="plate">Placa *</Label>
                    <Input
                      id="plate"
                      value={vehiclePlate}
                      aria-invalid={!!errors.vehiclePlate}
                      onChange={(e) => {
                        setVehiclePlate(e.target.value.toUpperCase());
                        clearError("vehiclePlate");
                      }}
                      placeholder="ABC-1D23"
                    />
                    {errors.vehiclePlate && (
                      <p className="text-xs text-destructive">{errors.vehiclePlate}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="model">Modelo (opcional)</Label>
                  <Input
                    id="model"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Honda CG 160"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {phase === "done" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Cadastro enviado!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sua conta está <strong>aguardando aprovação</strong> da revendedora{" "}
                  <strong>{reseller?.name}</strong>. Assim que for aprovada, você poderá começar a
                  receber pedidos. Use seu CPF e senha para entrar.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate({ to: "/login" })}>
                Ir para o login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
