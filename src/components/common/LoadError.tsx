import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

/** Inline "couldn't load" card, so a failed request isn't mistaken for an empty list. */
export function LoadError({ message, onRetry, retrying = false }: Props) {
  return (
    <Card>
      <CardContent className="space-y-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          {retrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
