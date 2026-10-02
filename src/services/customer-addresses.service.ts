import { api } from "@/integrations/api/client";
import type { CreateCustomerAddress, CustomerAddress } from "@/types/customer";

export type UpdateCustomerAddressDTO = Partial<
  Omit<CustomerAddress, "_id" | "userId" | "createdAt" | "updatedAt">
>;

export const customerAddressesService = {
  findCustomerAddresses: () => {
    return api.get<CustomerAddress[]>("/customer-addresses");
  },

  updateCustomerAddress: (id: string, data: UpdateCustomerAddressDTO) => {
    return api.patch(`/customer-addresses/${id}`, data);
  },

  findById(id: string) {
    return api.get<CustomerAddress>(`/customer-addresses/${id}`);
  },

  create(data: CreateCustomerAddress) {
    return api.post<CustomerAddress>("/customer-addresses", data);
  },
};
