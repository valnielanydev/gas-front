import type { AddressValue } from "@/types/address";

export const emptyAddress: AddressValue = {
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  latitude: null,
  longitude: null,
};

/** One-line address ("Rua X, 123, Bairro, Cidade - UF, CEP"), skipping empty parts. */
export function formatAddressValue(a: AddressValue): string {
  return [
    a.street && a.number ? `${a.street}, ${a.number}` : a.street,
    a.neighborhood,
    a.city && a.state ? `${a.city} - ${a.state}` : a.city || a.state,
    a.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Free-text query for geocoding a structured address. */
export function buildGeocodeQuery(v: AddressValue): string {
  return [
    v.street && v.number ? `${v.street}, ${v.number}` : v.street,
    v.neighborhood,
    v.city,
    v.state,
    v.postalCode,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}
