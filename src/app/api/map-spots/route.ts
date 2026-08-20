import { NextResponse } from "next/server";
import { extractGoogleMapsCoordinates } from "@/lib/googleMapsLink";
import { fallbackMapSpots, type MapSpot, type SpotCategory } from "@/lib/map-spots";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type MapSpotRow = {
  address: string | null;
  category: SpotCategory;
  city: string | null;
  description: string | null;
  google_maps_url: string | null;
  latitude: number;
  longitude: number;
  name: string;
  neighborhood: string | null;
  slug: string;
  source_list_url: string | null;
};

function toMapSpot(row: MapSpotRow): MapSpot {
  const exactCoordinates = row.google_maps_url ? extractGoogleMapsCoordinates(row.google_maps_url) : null;

  return {
    address: row.address,
    category: row.category,
    city: row.city,
    description: row.description ?? "",
    googleMapsUrl: row.google_maps_url,
    id: row.slug,
    latitude: exactCoordinates?.latitude ?? Number(row.latitude),
    longitude: exactCoordinates?.longitude ?? Number(row.longitude),
    name: row.name,
    neighborhood: row.neighborhood,
    sourceListUrl: row.source_list_url
  };
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ source: "fallback", spots: fallbackMapSpots });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("map_spots")
      .select("slug,name,category,city,description,address,neighborhood,latitude,longitude,google_maps_url,source_list_url")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({ source: "fallback", spots: fallbackMapSpots });
    }

    return NextResponse.json({
      source: "supabase",
      spots: (data as MapSpotRow[]).map(toMapSpot)
    });
  } catch {
    return NextResponse.json({ source: "fallback", spots: fallbackMapSpots });
  }
}
