import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { geoService } from "@/services/geo.service";

export type AddressSuggestion = {
  display_name: string;
  lat: number;
  lon: number;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: AddressSuggestion) => void;
  placeholder?: string;
  /** optional bias center [lat, lng] to prioritize nearby results */
  near?: [number, number] | null;
  className?: string;
  autoFocus?: boolean;
};

/**
 * Lightweight Uber-like address autocomplete using OSM Nominatim.
 * - Debounced (350ms)
 * - Country-restricted to Brazil
 * - Optional viewbox bias around `near` for closer suggestions first
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar endereço...",
  near,
  className,
  autoFocus,
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const justSelectedRef = useRef(false);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Compared by value: callers often pass a new array with the same coordinates
  const nearLat = near?.[0];
  const nearLng = near?.[1];

  // fetch on value change
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Cancels the pending search when the text changes, so an older, slower response
    // can never overwrite the suggestions for what the user typed last
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const bias: [number, number] | null =
        nearLat != null && nearLng != null ? [nearLat, nearLng] : null;
      try {
        const results = await geoService.searchAddress(q, {
          limit: 6,
          near: bias,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setSuggestions(
          results.map((r) => ({ display_name: r.displayName, lat: r.lat, lon: r.lon })),
        );
        setHighlight(0);
        setOpen(true);
      } catch {
        if (controller.signal.aborted) return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, nearLat, nearLng]);

  const pick = (s: AddressSuggestion) => {
    justSelectedRef.current = true;
    onChange(s.display_name);
    onSelect?.(s);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !suggestions.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(suggestions[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[700] mt-1 max-h-72 overflow-y-auto rounded-lg border bg-popover shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.lat},${s.lon},${i}`}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(s)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors",
                  i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
