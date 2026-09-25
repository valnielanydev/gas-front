import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resellerService } from "@/services/reseller.service";
import type { NearbyReseller } from "@/types/reseller";

const PAGE_SIZE = 3;

export function useNearbyResellers(pos: [number, number] | null) {
  const [resellers, setResellers] = useState<NearbyReseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pos) return;
    let cancelled = false;
    setLoading(true);
    resellerService
      .nearby(pos[0], pos[1])
      .then((data) => {
        if (cancelled) return;
        setResellers(
          (data ?? []).slice().sort((a, b) => Number(a.distance_km) - Number(b.distance_km)),
        );
        setVisibleCount(PAGE_SIZE);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        toast.error(e.message);
        setResellers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pos]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, resellers.length));
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [resellers.length]);

  return { resellers, loading, visibleCount, sentinelRef };
}
