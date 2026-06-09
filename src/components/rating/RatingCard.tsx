import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";

export type DeliveryRating = {
  rating: number;
  comment: string | null;
  delivery_time_rating?: number | null;
};

type RatingCardProps = {
  orderId: string;
  existingRating: DeliveryRating | null;
  allowEdit?: boolean;
  onSaved?: (rating: DeliveryRating) => void;
  title?: string;
  expectedEvaluatorRole?: "customer" | "driver";
};

export function RatingCard({
  orderId,
  existingRating,
  allowEdit = false,
  onSaved,
  title = "Avaliação do motorista",
  expectedEvaluatorRole = "customer",
}: RatingCardProps) {
  const [editing, setEditing] = useState(!existingRating);
  const [value, setValue] = useState(existingRating?.rating ?? 5);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [timeValue, setTimeValue] = useState(existingRating?.delivery_time_rating ?? 5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(existingRating?.rating ?? 5);
    setComment(existingRating?.comment ?? "");
    setTimeValue(existingRating?.delivery_time_rating ?? 5);
    setEditing(!existingRating);
  }, [existingRating?.rating, existingRating?.comment]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = await api.post<DeliveryRating & { evaluator_role?: "customer" | "driver" }>(
        `/orders/${orderId}/rating`,
        { rating: value, comment, delivery_time_rating: timeValue },
      );
      if (payload.evaluator_role && payload.evaluator_role !== expectedEvaluatorRole) {
        toast.error("Avaliação recebida de um perfil diferente do esperado. Tente novamente.");
        return;
      }
      const normalized: DeliveryRating = {
        rating: Number(payload.rating),
        comment: payload.comment ?? null,
        delivery_time_rating: payload.delivery_time_rating ?? null,
      };
      onSaved?.(normalized);
      setEditing(false);
      toast.success("Avaliação salva com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar avaliação");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border bg-muted/30 p-3">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {!editing && existingRating ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{existingRating.rating}/5</span>
            </div>
            <p className="break-words text-sm text-muted-foreground">
              {existingRating.comment || "Sem comentário."}
            </p>
            {allowEdit ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Editar avaliação
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={value === n ? "default" : "outline"}
                  onClick={() => setValue(n)}
                >
                  <Star className="mr-1 h-3.5 w-3.5" /> {n}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Comentário opcional"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full min-h-[80px] max-h-[120px] resize-none text-xs"
            />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tempo de entrega</p>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={`t-${n}`}
                    size="sm"
                    variant={timeValue === n ? "default" : "outline"}
                    onClick={() => setTimeValue(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                {existingRating ? "Salvar avaliação" : "Enviar avaliação"}
              </Button>
              {existingRating && allowEdit ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
