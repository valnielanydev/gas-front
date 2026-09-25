import { useState } from "react";
import { Copy, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resellerService } from "@/services/reseller.service";

export function DriverInviteCard() {
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await resellerService.generateDriverInvite();
      const url = `${window.location.origin}/driver/signup?token=${res.token}`;
      setInvite({ url, expiresAt: res.expires_at });
      toast.success("Convite gerado! Válido por 24h.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar convite");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  const waMsg = invite
    ? `Olá! Use este link para se cadastrar como motorista no VaptGás (válido por 24h): ${invite.url}`
    : "";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Convidar motorista
            </p>
            <p className="text-sm text-muted-foreground">
              Gere um link único e compartilhe. Cada link vale 24h e só pode ser usado uma vez.
            </p>
          </div>
          <Button onClick={generate} disabled={loading} size="sm">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Share2 className="h-4 w-4" />
            {invite ? "Gerar novo" : "Gerar convite"}
          </Button>
        </div>
        {invite && (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="break-all font-mono text-xs text-foreground">{invite.url}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expira em {new Date(invite.expiresAt).toLocaleString("pt-BR")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(invite.url, "Link")}>
                <Copy className="h-4 w-4" /> Copiar link
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" type="button">
                  WhatsApp
                </Button>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent("Convite VaptGás - Motorista")}&body=${encodeURIComponent(waMsg)}`}
              >
                <Button variant="outline" size="sm" type="button">
                  E-mail
                </Button>
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
