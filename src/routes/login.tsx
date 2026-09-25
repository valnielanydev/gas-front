import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { authService } from "@/services/auth.service";
import { formatCpf, isValidCpf } from "@/lib/cpf";
import { FlameMark } from "@/components/login/FlameMark";
import { ClientStep } from "@/components/login/ClientStep";
import { SignupStep } from "@/components/login/SignupStep";
import { StaffStep } from "@/components/login/StaffStep";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export default LoginPage;

type Step = "client" | "signup" | "staff";

function LoginPage() {
  const { signIn, isAuthenticated, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("client");
  const [loading, setLoading] = useState(false);

  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [staffRole, setStaffRole] = useState<"rev" | "admin">("rev");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);

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
      const res = await authService.checkCpf(cpf.replace(/\D/g, ""));
      if (!res.exists) {
        setStep("signup");
        toast.info("CPF não cadastrado. Complete o cadastro para continuar.");
        return;
      }
      await signIn(cpf.replace(/\D/g, ""), password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register({
        cpf: cpf.replace(/\D/g, ""),
        name,
        email,
        phone: phone.replace(/\D/g, "") || undefined,
        password,
      });
      await signIn(cpf.replace(/\D/g, ""), password);
      toast.success("Conta criada! Bem-vindo ao VaptGás.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
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
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col px-6 bg-[radial-gradient(120%_60%_at_50%_-8%,#0f2a5e_0%,#0f172a_38%,#020617_100%)] text-slate-200 antialiased [font-family:-apple-system,system-ui,sans-serif]">
      <div className="h-14" />

      <div className="mb-8 flex flex-col items-center gap-4">
        <Link to="/">
          <FlameMark size={68} />
        </Link>
        <div className="text-center">
          <div className="text-[27px] font-extrabold tracking-tight">
            Vapt<span className="text-sky-400">Gás</span>
          </div>
          <div className="mt-1 text-sm font-medium text-slate-400">Seu gás, num toque</div>
        </div>
      </div>

      {step === "client" && (
        <ClientStep
          cpf={cpf}
          onCpfChange={(v) => setCpf(formatCpf(v))}
          password={password}
          onPasswordChange={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((s) => !s)}
          loading={loading}
          ready={isValidCpf(cpf) && password.length >= 4}
          onSubmit={onSubmitClient}
          onSelectRole={(role) => {
            setStaffRole(role);
            setStep("staff");
          }}
        />
      )}

      {step === "signup" && (
        <SignupStep
          name={name}
          onNameChange={setName}
          email={email}
          onEmailChange={setEmail}
          phone={phone}
          onPhoneChange={setPhone}
          loading={loading}
          ready={name.length > 0 && email.length > 0}
          onSubmit={onSubmitSignup}
          onBack={() => setStep("client")}
        />
      )}

      {step === "staff" && (
        <StaffStep
          role={staffRole}
          email={staffEmail}
          onEmailChange={setStaffEmail}
          password={staffPassword}
          onPasswordChange={setStaffPassword}
          showPassword={showStaffPassword}
          onTogglePassword={() => setShowStaffPassword((s) => !s)}
          loading={loading}
          ready={staffEmail.length > 0 && staffPassword.length >= 4}
          onSubmit={onSubmitStaff}
          onBack={() => setStep("client")}
        />
      )}
    </div>
  );
}
