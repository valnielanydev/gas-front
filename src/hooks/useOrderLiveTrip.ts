import { useMemo, useState } from "react";
import { haversineKm } from "@/lib/distance";
import { SPEED_KMH } from "@/lib/constants";
import type { Coords } from "@/types/common";
import type { FullOrder, TrackingDriver, TrackingReseller } from "@/types/order";

export type LiveTrip = { km: number; eta: number; source: "route" | "driver" | "reseller" };

/**
 * Coordinates and distance/ETA estimate for an order being tracked. Prefers the real
 * route reported by the map (`setRoute`), then a straight line from the driver, then
 * a straight line from the reseller.
 */
export function useOrderLiveTrip(
  order: FullOrder | null,
  driver: TrackingDriver | null,
  reseller: TrackingReseller | null,
) {
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeEtaMin, setRouteEtaMin] = useState<number | null>(null);

  const customerCoords = useMemo((): Coords | null => {
    if (order?.customer_latitude == null || order?.customer_longitude == null) return null;
    return { lat: Number(order.customer_latitude), lng: Number(order.customer_longitude) };
  }, [order?.customer_latitude, order?.customer_longitude]);

  const driverCoords = useMemo((): Coords | null => {
    if (driver?.current_latitude == null || driver?.current_longitude == null) return null;
    return { lat: Number(driver.current_latitude), lng: Number(driver.current_longitude) };
  }, [driver?.current_latitude, driver?.current_longitude]);

  const liveTrip = useMemo(() => {
    if (!customerCoords) return null;
    if (driverCoords) {
      const km = routeDistanceKm ?? haversineKm(driverCoords, customerCoords);
      const eta = routeEtaMin ?? Math.max(1, Math.round((km / SPEED_KMH.driver) * 60));
      return { km, eta, source: routeDistanceKm ? ("route" as const) : ("driver" as const) };
    }
    if (reseller?.latitude != null && reseller.longitude != null) {
      const km = haversineKm(
        { lat: Number(reseller.latitude), lng: Number(reseller.longitude) },
        customerCoords,
      );
      return {
        km,
        eta: Math.max(1, Math.round((km / SPEED_KMH.resellerEstimate) * 60)),
        source: "reseller" as const,
      };
    }
    return null;
  }, [
    customerCoords,
    driverCoords,
    reseller?.latitude,
    reseller?.longitude,
    routeDistanceKm,
    routeEtaMin,
  ]);

  const setRoute = (km: number, eta: number) => {
    setRouteDistanceKm(km);
    setRouteEtaMin(eta);
  };

  return { customerCoords, driverCoords, liveTrip: liveTrip as LiveTrip | null, setRoute };
}
