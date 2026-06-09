import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ratingValue: number;
  onRatingChange: (v: number) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
}

export function DeliveryRatingDrawer({
  open,
  onOpenChange,
  ratingValue,
  onRatingChange,
  comment,
  onCommentChange,
  saving,
  onSubmit,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh] overflow-y-auto">
        <DrawerHeader className="text-left">
          <DrawerTitle>Avaliar cliente</DrawerTitle>
          <DrawerDescription>Como foi a experiência desta entrega?</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={ratingValue === n ? "default" : "outline"}
                onClick={() => onRatingChange(n)}
              >
                {n}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Comentário opcional"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
        </div>
        <DrawerFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Depois
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar avaliação
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
