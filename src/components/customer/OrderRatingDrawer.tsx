import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ratingValue: number;
  onRatingChange: (v: number) => void;
  deliveryTimeRatingValue: number;
  onDeliveryTimeRatingChange: (v: number) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}

export function OrderRatingDrawer({
  open,
  onOpenChange,
  ratingValue,
  onRatingChange,
  deliveryTimeRatingValue,
  onDeliveryTimeRatingChange,
  comment,
  onCommentChange,
  saving,
  onSubmit,
  onSkip,
}: Props) {
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) void onSkip();
        else onOpenChange(o);
      }}
    >
      <DrawerContent className="max-h-[85dvh] overflow-y-auto">
        <DrawerHeader className="text-left">
          <DrawerTitle>Avalie sua entrega</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">⭐ Avaliação do motorista</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={`driver-${n}`}
                  size="sm"
                  variant={ratingValue === n ? "default" : "outline"}
                  onClick={() => onRatingChange(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">⏱️ Avaliação do tempo de entrega</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={`time-${n}`}
                  size="sm"
                  variant={deliveryTimeRatingValue === n ? "default" : "outline"}
                  onClick={() => onDeliveryTimeRatingChange(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            className="min-h-[90px]"
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enviar avaliação
            </Button>
            <Button className="flex-1" variant="outline" onClick={onSkip} disabled={saving}>
              Pular
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
