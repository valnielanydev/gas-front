import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Flame, Loader2, ShieldCheck, Store, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/auth/AuthProvider";
import { formatCpf, isValidCpf } from "@/lib/cpf";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export default LoginPage;

type Step = "client" | "staff";

function LoginPage() {
  const { signIn, isAuthenticated, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("client");
  const [loading, setLoading] = useState(false);

  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (hasRole("master")) navigate({ to: "/master", replace: true });
    else if (hasRole("reseller_admin")) navigate({ to: "/app", replace: true });
    else if (hasRole("driver")) navigate({ to: "/driver", replace: true });
    else navigate({ to: "/customer", replace: true });
  }, [hasRole, isAuthenticated, isLoading, navigate]);

  const onSubmitClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidCpf(cpf) || !password) return;
    setLoading(true);
    try {
      await signIn(cpf.replace(/\D/g, ""), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("inválid")) {
        toast.error("CPF ou senha inválidos");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitStaff = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(staffEmail, staffPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("inválid")) {
        toast.error("E-mail ou senha inválidos");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#0ea5a4)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full rounded-2xl border-white/20 bg-white/95 shadow-2xl dark:bg-[#020617]/90">
          <CardHeader className="space-y-4 text-center">
            <Link to="/" className="mx-auto flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
                <Flame className="h-6 w-6" />
              </span>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                VaptGás
              </span>
            </Link>
            <div>
              <CardTitle>{step === "staff" ? "Acesso administrativo" : "Entrar"}</CardTitle>
              <CardDescription>
                {step === "staff" ? "Para revendedoras e admins" : "Entre com CPF e senha"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {step === "client" && (
              <form onSubmit={onSubmitClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    autoComplete="username"
                    className="rounded-xl border-white/20 bg-white/70 text-center text-lg tracking-wider dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="rounded-xl border-white/20 bg-white/70 dark:bg-white/10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !isValidCpf(cpf)}
                  className="h-11 w-full rounded-xl bg-blue-700 hover:bg-blue-600"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar
                </Button>
                <div className="grid gap-2 pt-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-white/40 bg-white/40 dark:bg-white/5"
                    onClick={() => setStep("staff")}
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Sou revendedora
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-white/40 bg-white/40 dark:bg-white/5"
                    onClick={() => setStep("staff")}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Sou admin
                  </Button>
                </div>
              </form>
            )}

            {step === "staff" && (
              <form onSubmit={onSubmitStaff} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep("client")}
                  className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Voltar
                </button>
                <div className="space-y-2">
                  <Label htmlFor="semail">E-mail</Label>
                  <Input
                    id="semail"
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spass">Senha</Label>
                  <Input
                    id="spass"
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
