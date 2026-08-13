export type SpotCategory = "cafe" | "food" | "study";

export type MapSpot = {
  address?: string | null;
  category: SpotCategory;
  description: string;
  googleMapsUrl?: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  neighborhood?: string | null;
  sourceListUrl?: string | null;
};

const categoryDescription: Record<SpotCategory, string> = {
  cafe: "KSAN이 고른 카페 목록에 저장된 장소입니다.",
  food: "KSAN이 고른 맛집 목록에 저장된 장소입니다.",
  study: "KSAN이 고른 공부 스팟 목록에 저장된 장소입니다."
};

const categoryListUrl: Record<SpotCategory, string> = {
  cafe: "https://maps.app.goo.gl/AJw35F6oMZ11ypy97",
  food: "https://maps.app.goo.gl/cL9qwJgA5WJW12qg6",
  study: "https://maps.app.goo.gl/mRk3EhGniLoKbfcq9"
};

function spot(
  id: string,
  name: string,
  category: SpotCategory,
  latitude: number,
  longitude: number,
  neighborhood?: string
): MapSpot {
  return {
    category,
    description: categoryDescription[category],
    id,
    latitude,
    longitude,
    name,
    neighborhood,
    sourceListUrl: categoryListUrl[category]
  };
}

export const fallbackMapSpots: MapSpot[] = [
  spot("louf-de-pijp", "louf - de pijp", "cafe", 52.3571381, 4.8985658, "De Pijp"),
  spot("tea-kee-bubble-tea", "TEA KEE Bubble Tea 奶茶 Amsterdam", "cafe", 52.3613652, 4.882625, "Oud-West"),
  spot("pantopia", "Pantopia", "cafe", 52.363441, 4.8891127, "Centrum"),
  spot("two-story", "Two Story", "cafe", 52.368605, 4.8885173, "Jordaan"),
  spot("yusu", "YUSU", "cafe", 52.3598497, 4.9110984, "Oost"),
  spot("baking-lab-amsterdam", "Baking Lab Amsterdam", "cafe", 52.3584672, 4.9266459, "Oost"),
  spot("impero-romano-amsterdam", "Impero Romano Amsterdam", "food", 52.3567942, 4.904448, "De Pijp"),
  spot("lagom-amsterdam", "Lagom Amsterdam", "food", 52.3705682, 4.9007592, "Centrum"),
  spot("olido-pizzeria-amsterdam-oost", "Olidò - Pizzeria Amsterdam Oost", "food", 52.3553917, 4.9337599, "Oost"),
  spot("sushi-fanatics", "Sushi Fanatics", "food", 52.3592855, 4.9137969, "Oost"),
  spot("the-cottage", "The Cottage", "food", 52.356135, 4.927206, "Oost"),
  spot("soju-amsterdam", "소주", "food", 52.3564673, 4.8907568, "De Pijp"),
  spot("linguini-de-pijp", "Linguini de Pijp", "food", 52.3575174, 4.8896736, "De Pijp"),
  spot("oba-oosterdok-public-library", "OBA Oosterdok - Public Library", "study", 52.3762463, 4.9081983, "Oosterdok"),
  spot("amsterdam-university-library", "Amsterdam University Library", "study", 52.3682658, 4.8949341, "Centrum")
];

export const mapCategoryListUrls = categoryListUrl;
