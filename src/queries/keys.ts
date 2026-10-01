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
  /** Records of the logged-in driver, keyed by user id (the driver id isn't known yet). */
  self: (userId: string | undefined) => [...driverKeys.all, "self", userId] as const,
  selfProfile: (userId: string | undefined) => [...driverKeys.self(userId), "profile"] as const,
  selfDashboard: (userId: string | undefined) => [...driverKeys.self(userId), "dashboard"] as const,
  selfDeliveries: (userId: string | undefined) =>
    [...driverKeys.self(userId), "deliveries"] as const,
  customerDetails: (userId: string | undefined, orderIds: string[]) =>
    [...driverKeys.self(userId), "customer-details", orderIds] as const,
  invite: (token: string) => [...driverKeys.all, "invite", token] as const,
};

export const customerKeys = {
  all: ["customer"] as const,
  detail: (userId: string | undefined) => [...customerKeys.all, userId] as const,
  activeOrder: (userId: string | undefined) =>
    [...customerKeys.detail(userId), "active-order"] as const,
  lastDeliveryAddress: (userId: string | undefined) =>
    [...customerKeys.detail(userId), "last-delivery-address"] as const,
  orders: (userId: string | undefined) => [...customerKeys.detail(userId), "orders"] as const,
  ratingsAll: (userId: string | undefined) => [...customerKeys.detail(userId), "ratings"] as const,
  ratings: (userId: string | undefined, orderIds: string[]) =>
    [...customerKeys.ratingsAll(userId), orderIds] as const,
  driverMetrics: (userId: string | undefined, orderIds: string[]) =>
    [...customerKeys.detail(userId), "driver-metrics", orderIds] as const,
  blockedDrivers: (userId: string | undefined) =>
    [...customerKeys.detail(userId), "blocked-drivers"] as const,
  addresses: (userId: string | undefined) => [...customerKeys.detail(userId), "addresses"] as const,
  address: (userId: string | undefined, id: string) =>
    [...customerKeys.addresses(userId), id] as const,
};

export const orderKeys = {
  all: ["order"] as const,
  tracking: (orderId: string) => [...orderKeys.all, orderId, "tracking"] as const,
  detail: (orderId: string) => [...orderKeys.all, orderId, "detail"] as const,
};
