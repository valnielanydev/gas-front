export interface Coords {
  lat: number;
  lng: number;
}

export interface Paginated<T> {
  orders: T[];
  hasMore: boolean;
}
