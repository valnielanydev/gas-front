import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resellerService } from "@/services/reseller.service";
import type { NearbyReseller } from "@/types/reseller";

const PAGE_SIZE = 3;

/**
 * Resellers around `pos`. With no position yet, it reports loading only while the GPS is
 * still trying (`locationFailed` false); once it failed, the list is simply empty so the
 * screen can ask for an address instead of spinning forever.
 */
export function useNearbyResellers(pos: [number, number] | null, locationFailed: boolean) {
  const [resellers, setResellers] = useState<NearbyReseller[]>([]);
  const [fetching, setFetching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pos) return;
    let cancelled = false;
    setFetching(true);
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
        if (!cancelled) setFetching(false);
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

  const loading = pos ? fetching : !locationFailed;

  return { resellers, loading, visibleCount, sentinelRef };
}
