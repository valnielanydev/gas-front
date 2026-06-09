import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: number;
  comment: string;
  onValueChange?: (value: number) => void;
  onCommentChange?: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  readOnly?: boolean;
  title?: string;
};

export function RatingForm({
  value,
  comment,
  onValueChange,
  onCommentChange,
  onSubmit,
  onCancel,
  submitLabel = "Salvar avaliação",
  loading = false,
  readOnly = false,
  title,
}: Props) {
  if (readOnly) {
    return (
      <div className="space-y-2 rounded-md border p-3">
        {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
        <div className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{value}/5</span>
        </div>
        {comment ? (
          <p className="text-sm text-muted-foreground">{comment}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Sem comentário.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            size="sm"
            variant={value === n ? "default" : "outline"}
            onClick={() => onValueChange?.(n)}
          >
            <Star className="mr-1 h-3.5 w-3.5" /> {n}
          </Button>
        ))}
      </div>
      <Textarea
        placeholder="Comentário opcional"
        value={comment}
        onChange={(e) => onCommentChange?.(e.target.value)}
        className="text-xs"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
