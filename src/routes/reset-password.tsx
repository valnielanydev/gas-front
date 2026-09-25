import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Try hash first (#token=...) — fragment is never sent to servers or CDN logs
    const hashToken = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (hashToken) {
      setToken(hashToken);
      history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }
    // Fall back to query string but strip immediately so token doesn't linger in history/logs
    const searchParams = new URLSearchParams(window.location.search);
    const searchToken = searchParams.get("token");
    if (searchToken) {
      setToken(searchToken);
      searchParams.delete("token");
      const rest = searchParams.toString();
      history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""));
      return;
    }
    toast.error("Link de redefinição inválido ou expirado");
    navigate({ to: "/login" });
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mínimo 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não coincidem");
    if (!token) return;
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success("Senha redefinida! Faça login novamente.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-foreground">VaptGás</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>Defina sua nova senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="np">Nova senha</Label>
                  <Input
                    id="np"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cp">Confirmar nova senha</Label>
                  <Input
                    id="cp"
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar nova senha
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
