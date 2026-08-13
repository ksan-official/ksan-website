import { NextResponse } from "next/server";
import { fallbackMapSpots, type MapSpot, type SpotCategory } from "@/lib/map-spots";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type MapSpotRow = {
  address: string | null;
  category: SpotCategory;
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
  return {
    address: row.address,
    category: row.category,
    description: row.description ?? "KSAN 학생 큐레이션에 등록된 장소입니다.",
    googleMapsUrl: row.google_maps_url,
    id: row.slug,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
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
      .select("slug,name,category,description,address,neighborhood,latitude,longitude,google_maps_url,source_list_url")
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
