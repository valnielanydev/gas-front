/**
 * Query key factories. Every key starts with its domain prefix, so invalidating a
 * shorter key (e.g. `adminKeys.resellers()`) also refreshes every query below it.
 */

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  orders: (limit: number) => [...adminKeys.all, "orders", limit] as const,
  users: () => [...adminKeys.all, "users"] as const,
  resellers: () => [...adminKeys.all, "resellers"] as const,
  resellerList: (params: { active?: boolean } = {}) => [...adminKeys.resellers(), params] as const,
};

export const resellerKeys = {
  all: ["reseller"] as const,
  detail: (resellerId: string | null) => [...resellerKeys.all, resellerId] as const,
  stats: (resellerId: string | null) => [...resellerKeys.detail(resellerId), "stats"] as const,
  orders: (resellerId: string | null) => [...resellerKeys.detail(resellerId), "orders"] as const,
  products: (resellerId: string | null) =>
    [...resellerKeys.detail(resellerId), "products"] as const,
  drivers: (resellerId: string | null) => [...resellerKeys.detail(resellerId), "drivers"] as const,
};

export const driverKeys = {
  all: ["driver"] as const,
  detail: (driverId: string | undefined) => [...driverKeys.all, driverId] as const,
  history: (driverId: string | undefined) => [...driverKeys.detail(driverId), "history"] as const,
  /** Active + pending orders shown on the driver dashboard. */
  orders: (driverId: string | undefined) => [...driverKeys.detail(driverId), "orders"] as const,
};

export const customerKeys = {
  all: ["customer"] as const,
  detail: (userId: string | undefined) => [...customerKeys.all, userId] as const,
  activeOrder: (userId: string | undefined) =>
    [...customerKeys.detail(userId), "active-order"] as const,
  lastDeliveryAddress: (userId: string | undefined) =>
    [...customerKeys.detail(userId), "last-delivery-address"] as const,
};

export const orderKeys = {
  all: ["order"] as const,
  tracking: (orderId: string) => [...orderKeys.all, orderId, "tracking"] as const,
};
