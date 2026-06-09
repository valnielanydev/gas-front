import { useEffect, useRef } from "react";
import { driverService } from "@/services/driver.service";

interface Args {
  driverId: string | undefined;
  driverStatus: string | undefined;
  activeOrderId: string | null;
  onLocationUpdate: (coords: { lat: number; lng: number }) => void;
  onGpsError?: (consecutiveCount: number) => void;
}

export function useDriverLocation({
  driverId,
  driverStatus,
  activeOrderId,
  onLocationUpdate,
  onGpsError,
}: Args) {
  const onLocationUpdateRef = useRef(onLocationUpdate);
  onLocationUpdateRef.current = onLocationUpdate;
  const onGpsErrorRef = useRef(onGpsError);
  onGpsErrorRef.current = onGpsError;

  useEffect(() => {
    if (!driverId) return;
    const isOnline = driverStatus !== "offline";
    const shouldTrack = isOnline || !!activeOrderId;
    if (!shouldTrack) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    let lastSentAt = 0;
    let lastCoords: { lat: number; lng: number } | null = null;
    let consecutiveErrors = 0;
    const MIN_INTERVAL_MS = 10_000;

    const flush = async () => {
      if (!lastCoords) return;
      const now = Date.now();
      if (now - lastSentAt < MIN_INTERVAL_MS) return;
      lastSentAt = now;
      await driverService.updateLocation(lastCoords.lat, lastCoords.lng).catch(() => {});
    };

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        consecutiveErrors = 0;
        lastCoords = { lat: p.coords.latitude, lng: p.coords.longitude };
        onLocationUpdateRef.current(lastCoords);
        void flush();
      },
      () => {
        consecutiveErrors++;
        onGpsErrorRef.current?.(consecutiveErrors);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
    const intervalId = window.setInterval(flush, MIN_INTERVAL_MS);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(intervalId);
    };
  }, [driverId, driverStatus, activeOrderId]);
}
