export type SpotCategory = "cafe" | "food" | "study";

export type MapSpot = {
  address?: string | null;
  category: SpotCategory;
  city?: string | null;
  description: string;
  googleMapsUrl?: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  neighborhood?: string | null;
  sourceListUrl?: string | null;
};

const categoryListUrl: Record<SpotCategory, string> = {
  cafe: "https://maps.app.goo.gl/AJw35F6oMZ11ypy97",
  food: "https://maps.app.goo.gl/cL9qwJgA5WJW12qg6",
  study: "https://maps.app.goo.gl/mRk3EhGniLoKbfcq9"
};

export const fallbackMapSpots: MapSpot[] = [];

export const mapCategoryListUrls = categoryListUrl;
