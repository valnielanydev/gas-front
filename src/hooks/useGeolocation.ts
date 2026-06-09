import { useEffect, useState } from "react";

export type GeoError = "denied" | "timeout" | "unavailable";

export function useGeolocation() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [error, setError] = useState<GeoError | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setError("denied");
        else if (err.code === err.TIMEOUT) setError("timeout");
        else setError("unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return {
    pos,
    setPos,
    error,
    setError,
    denied: error === "denied",
    setDenied: (v: boolean) => setError(v ? "denied" : null),
  };
}
