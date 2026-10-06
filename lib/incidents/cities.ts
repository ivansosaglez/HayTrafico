/**
 * Páginas SEO por ciudad. `provinces` usa los nombres tal como los publica la DGT
 * (campo `province` del feed). Añadir una ciudad = añadir una entrada aquí.
 */
export interface CityPage {
  slug: string;
  name: string;
  provinces: string[];
  /** Centro y zoom iniciales del mapa. */
  center: [number, number];
  zoom: number;
}

export const CITIES: CityPage[] = [
  { slug: "madrid", name: "Madrid", provinces: ["Madrid"], center: [40.4168, -3.7038], zoom: 9 },
  { slug: "barcelona", name: "Barcelona", provinces: ["Barcelona"], center: [41.3874, 2.1686], zoom: 9 },
  { slug: "valencia", name: "Valencia", provinces: ["València/Valencia"], center: [39.4699, -0.3763], zoom: 9 },
  { slug: "sevilla", name: "Sevilla", provinces: ["Sevilla"], center: [37.3891, -5.9845], zoom: 9 },
  { slug: "zaragoza", name: "Zaragoza", provinces: ["Zaragoza"], center: [41.6488, -0.8891], zoom: 9 },
  { slug: "malaga", name: "Málaga", provinces: ["Málaga"], center: [36.7213, -4.4214], zoom: 9 },
  { slug: "alicante", name: "Alicante", provinces: ["Alacant/Alicante"], center: [38.3452, -0.481], zoom: 9 },
  { slug: "tenerife", name: "Tenerife", provinces: ["Santa Cruz de Tenerife"], center: [28.2916, -16.6291], zoom: 9 },
];

export const SPAIN_VIEW = { center: [40.2, -3.7] as [number, number], zoom: 6 };

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
