import { NextResponse } from "next/server";
import { isDeletedEventRow, ksanEvents, parseEventMediaDescription, toKsanEventFromRow, type EventTableRow, type KsanEvent } from "@/lib/events";
import { createServerSupabaseClient, createServiceSupabaseClient, getSupabaseServerSecretKey, hasSupabaseConfig } from "@/lib/supabase";

const eventSelectWithMedia = "id,title,starts_at,location,description,registration_target,published,image_url,image_urls,sponsors,source_id";
const eventSelectFallback = "id,title,starts_at,location,description,registration_target,published";

function eventTime(event: KsanEvent) {
  const time = new Date(event.date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function orderEvents(events: KsanEvent[]) {
  return [...events].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "upcoming" ? -1 : 1;
    }

    return left.status === "upcoming"
      ? eventTime(left) - eventTime(right)
      : eventTime(right) - eventTime(left);
  });
}

function defaultSourceId(row: EventTableRow) {
  return row.source_id ?? parseEventMediaDescription(row.description ?? "").sourceId;
}

function mergeWithDefaultEvents(databaseEvents: KsanEvent[], suppressedDefaultIds: string[]) {
  const byId = new Map<string, KsanEvent>();

  for (const event of ksanEvents) {
    byId.set(event.id, event);
  }

  for (const id of suppressedDefaultIds) {
    byId.delete(id);
  }

  for (const event of databaseEvents) {
    byId.set(event.id, event);
  }

  return Array.from(byId.values());
}

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ events: orderEvents(ksanEvents), source: "fallback" });
  }

  try {
    const supabase = getSupabaseServerSecretKey() ? createServiceSupabaseClient() : createServerSupabaseClient();
    // Supabase infers a different row shape for the legacy fallback select.
    let result: any = await supabase
      .from("events")
      .select(eventSelectWithMedia)
      .order("starts_at", { ascending: true });

    if (result.error && /(image_url|image_urls|sponsors)/i.test(result.error.message)) {
      result = await supabase
        .from("events")
        .select(eventSelectFallback)
        .order("starts_at", { ascending: true });
    }

    const { data, error } = result;

    if (error) {
      console.error("Failed to query events from Supabase", error);
      return NextResponse.json({ events: [], source: "supabase-error" });
    }

    const rows = (data ?? []) as EventTableRow[];
    const suppressedDefaultIds = rows
      .filter((row) => isDeletedEventRow(row) || (row.published === false && Boolean(defaultSourceId(row))))
      .map((row) => defaultSourceId(row) ?? row.id);
    const databaseEvents = rows
      .filter((row) => !isDeletedEventRow(row) && row.published !== false)
      .map(toKsanEventFromRow);
    return NextResponse.json({
      events: orderEvents(mergeWithDefaultEvents(databaseEvents, suppressedDefaultIds)),
      source: databaseEvents.length ? "supabase+default" : "fallback"
    });
  } catch (error) {
    console.error("Failed to load events from Supabase", error);
    return NextResponse.json({ events: [], source: "supabase-error" });
  }
}
