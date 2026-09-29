export interface LngLat {
  lng: number;
  lat: number;
}

/** [minLng, minLat, maxLng, maxLat] in EPSG:4326. */
export type BBox = readonly [number, number, number, number];
