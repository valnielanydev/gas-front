/** Structured Brazilian address, optionally pinned on the map. */
export type AddressValue = {
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};
