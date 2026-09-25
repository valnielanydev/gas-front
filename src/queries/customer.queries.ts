import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customer.service";
import { customerKeys } from "./keys";

export function useCustomerActiveOrder(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.activeOrder(userId),
    enabled: !!userId,
    queryFn: () => customerService.activeOrder(),
  });
}

export function useLastDeliveryAddress(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.lastDeliveryAddress(userId),
    enabled: !!userId,
    queryFn: () => customerService.lastDeliveryAddress(),
    select: (data) =>
      data?.delivery_address
        ? {
            address: data.delivery_address,
            lat: data.delivery_latitude != null ? Number(data.delivery_latitude) : null,
            lng: data.delivery_longitude != null ? Number(data.delivery_longitude) : null,
          }
        : null,
  });
}
