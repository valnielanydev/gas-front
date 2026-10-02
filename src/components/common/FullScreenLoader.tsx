import { Loader2 } from "lucide-react";

/** Full-screen spinner shown while a route (e.g. its auth guard) is still loading. */
export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
