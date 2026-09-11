import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { ksanEvents } from "@/lib/events";

const eventImageBucket = "event-images";
const adminEventSelectWithMedia = "id,title,starts_at,location,description,registration_target,published,created_at,updated_at,image_url,image_urls,sponsors,source_id";
const adminEventSelectFallback = "id,title,starts_at,location,description,registration_target,published,created_at,updated_at";

type AdminEventRecord = {
  agenda?: string[];
  agendaText?: string;
  applicationDeadline?: string | null;
  audience?: string | null;
  created_at: string;
  description: string | null;
  id: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  location: string | null;
  published: boolean;
  registration_target: string | null;
  source?: string;
  source_id?: string | null;
  sponsors?: unknown;
  starts_at: string;
  title: string;
  updated_at: string | null;
  organizerLogo?: string | null;
  organizerName?: string | null;
  price?: string | null;
};

type EventExtraFields = {
  agenda?: string[];
  applicationDeadline?: string | null;
  audience?: string | null;
  organizerLogo?: string | null;
  organizerName?: string | null;
  price?: string | null;
};

function hasEventExtras(extras?: EventExtraFields) {
  return Boolean(extras?.agenda?.length || extras?.applicationDeadline || extras?.audience || extras?.organizerLogo || extras?.organizerName || extras?.price);
}

function eventMediaMarker(
  imageUrls: string[],
  sponsors: Array<{ image?: string; name: string }>,
  sourceId?: string | null,
  deleted = false,
  extras?: EventExtraFields
) {
  if (!imageUrls.length && !sponsors.length && !sourceId && !deleted && !hasEventExtras(extras)) return "";
  return `\n\n<!--ksan-event-media:${encodeURIComponent(JSON.stringify({
    agenda: extras?.agenda ?? [],
    applicationDeadline: extras?.applicationDeadline ?? null,
    audience: extras?.audience ?? null,
    deleted,
    imageUrls,
    organizerLogo: extras?.organizerLogo ?? null,
    organizerName: extras?.organizerName ?? null,
    price: extras?.price ?? null,
    sourceId,
    sponsors
  }))}-->`;
}

function withEventMediaMarker(
  description: string,
  imageUrls: string[],
  sponsors: Array<{ image?: string; name: string }>,
  sourceId?: string | null,
  deleted = false,
  extras?: EventExtraFields
) {
  return `${description.replace(/\s*<!--ksan-event-media:[^>]*-->\s*$/g, "").trim()}${eventMediaMarker(imageUrls, sponsors, sourceId, deleted, extras)}`;
}

function parseEventMediaDescription(value: string | null) {
  const description = value ?? "";
  const markerMatch = description.match(/\s*<!--ksan-event-media:([^>]*)-->\s*$/);
  if (!markerMatch) {
    return {
      agenda: [] as string[],
      applicationDeadline: null as string | null,
      audience: null as string | null,
      deleted: false,
      description,
      imageUrls: [],
      organizerLogo: null as string | null,
      organizerName: null as string | null,
      price: null as string | null,
      sourceId: null,
      sponsors: [] as Array<{ image: string; name: string }>
    };
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(markerMatch[1] ?? "")) as {
      agenda?: unknown;
      applicationDeadline?: unknown;
      audience?: unknown;
      deleted?: unknown;
      imageUrls?: unknown;
      organizerLogo?: unknown;
      organizerName?: unknown;
      price?: unknown;
      sponsors?: unknown;
      sourceId?: unknown;
    };
    return {
      agenda: parseAgenda(parsed.agenda),
      applicationDeadline: clean(parsed.applicationDeadline),
      audience: clean(parsed.audience),
      deleted: parsed.deleted === true,
      description: description.slice(0, markerMatch.index).trim(),
      imageUrls: parseImageUrls(parsed.imageUrls),
      organizerLogo: clean(parsed.organizerLogo),
      organizerName: clean(parsed.organizerName),
      price: clean(parsed.price),
      sourceId: typeof parsed.sourceId === "string" ? parsed.sourceId : null,
      sponsors: parseSponsors(parsed.sponsors)
    };
  } catch {
    return {
      agenda: [],
      applicationDeadline: null,
      audience: null,
      deleted: false,
      description: description.replace(markerMatch[0], "").trim(),
      imageUrls: [],
      organizerLogo: null,
      organizerName: null,
      price: null,
      sourceId: null,
      sponsors: [] as Array<{ image: string; name: string }>
    };
  }
}

function normalizeAdminEvent(event: AdminEventRecord) {
  const media = parseEventMediaDescription(event.description);
  const imageUrls = event.image_urls?.length ? event.image_urls : media.imageUrls;
  const rowSponsors = parseSponsors(event.sponsors);
  const sponsors = rowSponsors.length ? rowSponsors : media.sponsors;

  return {
    ...event,
    deleted: media.deleted,
    description: media.description || event.description,
    agenda: media.agenda,
    agendaText: media.agenda.join("\n"),
    applicationDeadline: media.applicationDeadline,
    audience: media.audience,
    id: event.source_id ?? media.sourceId ?? event.id,
    image_url: event.image_url ?? imageUrls[0] ?? null,
    image_urls: imageUrls,
    organizerLogo: media.organizerLogo,
    organizerName: media.organizerName,
    source_id: event.source_id ?? media.sourceId,
    sponsors,
    price: media.price
  };
}

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function boolValue(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function isGoogleFormUrl(value: unknown) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "forms.gle" ||
      url.hostname === "forms.google.com" ||
      (url.hostname === "docs.google.com" && url.pathname.startsWith("/forms/"))
    );
  } catch {
    return false;
  }
}

async function ensureEventImageBucket(serviceClient: SupabaseClient) {
  const { error: getError } = await serviceClient.storage.getBucket(eventImageBucket);
  if (!getError) return null;

  const { error: createError } = await serviceClient.storage.createBucket(eventImageBucket, {
    public: true
  });

  return createError;
}

async function fileToDataUrl(photo: File) {
  const buffer = Buffer.from(await photo.arrayBuffer());
  return `data:${photo.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
}

async function uploadEventImage(serviceClient: SupabaseClient, photo: FormDataEntryValue | null, eventTitle: string, index = 0) {
  if (!(photo instanceof File) || photo.size === 0) return null;

  if (!photo.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있어요.");
  }

  const bucketError = await ensureEventImageBucket(serviceClient);
  if (bucketError) {
    console.warn("Event image bucket unavailable, saving image inline instead.", bucketError.message);
    return fileToDataUrl(photo);
  }

  const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeTitle = eventTitle.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "event";
  const path = `${safeTitle}/${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await serviceClient.storage.from(eventImageBucket).upload(path, photo, {
    cacheControl: "3600",
    contentType: photo.type,
    upsert: false
  });

  if (uploadError) {
    console.warn("Event image upload failed, saving image inline instead.", uploadError.message);
    return fileToDataUrl(photo);
  }

  const { data } = serviceClient.storage.from(eventImageBucket).getPublicUrl(path);
  return data.publicUrl;
}

function parseImageUrls(value: unknown) {
  if (Array.isArray(value)) return value.map((url) => String(url).trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((url) => String(url).trim()).filter(Boolean);
  } catch {
    return value.split(",").map((url) => url.trim()).filter(Boolean);
  }
  return [];
}

function parseAgenda(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function parseSponsors(value: unknown) {
  const parsedValue = typeof value === "string"
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return [];
        }
      })()
    : value;

  if (!Array.isArray(parsedValue)) return [];

  return parsedValue
    .map((sponsor, index) => {
      if (!sponsor || typeof sponsor !== "object") return null;
      const item = sponsor as { image?: unknown; name?: unknown };
      const image = clean(item.image);
      const name = clean(item.name) ?? `후원사 ${index + 1}`;
      return image ? { image, name } : null;
    })
    .filter((sponsor): sponsor is { image: string; name: string } => Boolean(sponsor));
}

async function orderedImageUrls(formData: FormData, serviceClient: SupabaseClient, eventTitle: string) {
  const rawOrder = clean(formData.get("imageOrder"));
  if (!rawOrder) return null;

  let items: Array<{ field?: string; kind?: string; url?: string }>;
  try {
    const parsed = JSON.parse(rawOrder);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }

  const urls: string[] = [];
  for (const [index, item] of items.entries()) {
    if (item.kind === "existing" && item.url) urls.push(item.url);
    if (item.kind === "upload" && item.field) {
      const uploadedUrl = await uploadEventImage(serviceClient, formData.get(item.field), eventTitle, index);
      if (uploadedUrl) urls.push(uploadedUrl);
    }
  }

  return urls;
}

async function orderedSponsors(formData: FormData, serviceClient: SupabaseClient, eventTitle: string) {
  const rawOrder = clean(formData.get("sponsorOrder"));
  if (!rawOrder) return null;

  let items: Array<{ field?: string; image?: string; kind?: string; name?: string }>;
  try {
    const parsed = JSON.parse(rawOrder);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }

  const sponsors: Array<{ image: string; name: string }> = [];
  for (const [index, item] of items.entries()) {
    if (item.kind === "existing" && item.image) {
      sponsors.push({ image: item.image, name: clean(item.name) ?? `후원사 ${index + 1}` });
    }
    if (item.kind === "upload" && item.field) {
      const uploadedUrl = await uploadEventImage(serviceClient, formData.get(item.field), `${eventTitle}-sponsor`, index);
      if (uploadedUrl) sponsors.push({ image: uploadedUrl, name: clean(item.name) ?? `후원사 ${index + 1}` });
    }
  }

  return sponsors;
}

async function requestPayload(request: Request, serviceClient: SupabaseClient) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) return request.json();

  const formData = await request.formData();
  const title = clean(formData.get("title")) ?? "event";
  const orderedUrls = await orderedImageUrls(formData, serviceClient, title);
  const imageUrls = orderedUrls ?? parseImageUrls(formData.get("imageUrls"));
  const orderedSponsorItems = await orderedSponsors(formData, serviceClient, title);

  return {
    agenda: parseAgenda(formData.get("agendaText")),
    applicationDeadline: clean(formData.get("applicationDeadline")),
    audience: clean(formData.get("audience")),
    description: clean(formData.get("description")) ?? "",
    id: clean(formData.get("id")),
    imageUrl: imageUrls[0] ?? clean(formData.get("imageUrl")),
    imageUrls,
    location: clean(formData.get("location")),
    organizerLogo: clean(formData.get("organizerLogo")),
    organizerName: clean(formData.get("organizerName")),
    price: clean(formData.get("price")),
    published: boolValue(formData.get("published")),
    registrationTarget: clean(formData.get("registrationTarget")),
    sponsors: orderedSponsorItems ?? parseSponsors(formData.get("sponsors")),
    startsAt: clean(formData.get("startsAt")),
    title
  };
}

function startsAtFromDefaultEvent(date: string, time: string) {
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch?.[1]?.padStart(2, "0") ?? "12";
  const minute = timeMatch?.[2] ?? "00";
  return `${date}T${hour}:${minute}:00.000Z`;
}

function defaultAdminEvents() {
  return ksanEvents.map((event) => ({
    agenda: event.agenda,
    agendaText: event.agenda.join("\n"),
    applicationDeadline: event.applicationDeadline ?? null,
    audience: event.audience,
    created_at: `${event.date}T00:00:00.000Z`,
    description: event.description,
    id: event.id,
    location: event.location,
    image_url: event.image,
    image_urls: event.recapImages?.length ? event.recapImages : [event.image],
    organizerLogo: event.organizerLogo ?? null,
    organizerName: event.organizerName ?? null,
    published: true,
    price: event.price ?? null,
    registration_target: event.registrationTarget ?? null,
    source: "default",
    source_id: event.id,
    sponsors: event.sponsors ?? [],
    starts_at: startsAtFromDefaultEvent(event.date, event.time),
    title: event.title,
    updated_at: null
  }));
}

function defaultEventForId(id: string) {
  return ksanEvents.find((event) => event.id === id) ?? null;
}

function sortAdminEvents<T extends { starts_at: string }>(events: T[]) {
  return [...events].sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime());
}

export async function GET(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  // Supabase infers a different row shape for the legacy fallback select.
  let result: any = await admin.serviceClient
    .from("events")
    .select(adminEventSelectWithMedia)
    .order("starts_at", { ascending: true });

  if (result.error && /(image_url|image_urls|sponsors)/i.test(result.error.message)) {
    result = await admin.serviceClient
      .from("events")
      .select(adminEventSelectFallback)
      .order("starts_at", { ascending: true });
  }

  const { data, error } = result;

  if (error) {
    console.error("Failed to load admin events from Supabase", error);
    return NextResponse.json({ events: sortAdminEvents(defaultAdminEvents()), warning: error.message });
  }

  const databaseEvents = ((data ?? []) as AdminEventRecord[]).map((event) => ({ ...normalizeAdminEvent(event), source: "database" }));
  const byId = new Map<string, (typeof databaseEvents)[number] | ReturnType<typeof defaultAdminEvents>[number]>();
  for (const event of defaultAdminEvents()) byId.set(event.id, event);
  for (const event of databaseEvents) {
    const eventId = String(event.source_id ?? event.id);
    if (event.deleted) {
      byId.delete(eventId);
      continue;
    }
    byId.set(eventId, event);
  }

  return NextResponse.json({ events: sortAdminEvents(Array.from(byId.values())) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  let payload: Awaited<ReturnType<typeof requestPayload>>;
  try {
    payload = await requestPayload(request, admin.serviceClient);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "업로드에 실패했습니다." }, { status: 400 });
  }

  if (payload.registrationTarget && !isGoogleFormUrl(payload.registrationTarget)) {
    return NextResponse.json({ error: "올바른 Google Form 링크를 입력해주세요." }, { status: 400 });
  }

  const insertRow = {
    title: payload.title,
    starts_at: payload.startsAt,
    location: payload.location,
    description: withEventMediaMarker(payload.description, payload.imageUrls ?? [], payload.sponsors ?? [], null, false, {
      agenda: payload.agenda,
      applicationDeadline: payload.applicationDeadline,
      audience: payload.audience,
      organizerLogo: payload.organizerLogo,
      organizerName: payload.organizerName,
      price: payload.price
    }),
    image_url: payload.imageUrl,
    image_urls: payload.imageUrls ?? [],
    registration_mode: "google_form",
    registration_target: payload.registrationTarget,
    published: Boolean(payload.published),
    sponsors: payload.sponsors ?? []
  };

  let { data, error } = await admin.serviceClient
    .from("events")
    .insert(insertRow)
    .select("id")
    .single();

  if (error && /(image_url|image_urls|sponsors)/i.test(error.message)) {
    const fallbackRow = {
      title: payload.title,
      starts_at: payload.startsAt,
      location: payload.location,
      description: withEventMediaMarker(payload.description, payload.imageUrls ?? [], payload.sponsors ?? [], null, false, {
        agenda: payload.agenda,
        applicationDeadline: payload.applicationDeadline,
        audience: payload.audience,
        organizerLogo: payload.organizerLogo,
        organizerName: payload.organizerName,
        price: payload.price
      }),
      registration_mode: "google_form",
      registration_target: payload.registrationTarget,
      published: Boolean(payload.published)
    };
    const fallbackResult = await admin.serviceClient.from("events").insert(fallbackRow).select("id").single();
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "행사 저장 결과를 확인하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  let payload: Awaited<ReturnType<typeof requestPayload>>;
  try {
    payload = await requestPayload(request, admin.serviceClient);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "업로드에 실패했습니다." }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "수정할 행사를 찾을 수 없습니다." }, { status: 400 });
  }

  const defaultEvent = defaultEventForId(String(payload.id));
  if (defaultEvent) {
    const overrideRow = {
      title: payload.title || defaultEvent.title,
      starts_at: payload.startsAt || startsAtFromDefaultEvent(defaultEvent.date, defaultEvent.time),
      location: payload.location ?? defaultEvent.location,
      description: withEventMediaMarker(payload.description ?? defaultEvent.description, payload.imageUrls ?? defaultEvent.recapImages ?? [defaultEvent.image], payload.sponsors ?? defaultEvent.sponsors ?? [], defaultEvent.id, false, {
        agenda: payload.agenda ?? defaultEvent.agenda,
        applicationDeadline: payload.applicationDeadline ?? defaultEvent.applicationDeadline,
        audience: payload.audience ?? defaultEvent.audience,
        organizerLogo: payload.organizerLogo ?? defaultEvent.organizerLogo,
        organizerName: payload.organizerName ?? defaultEvent.organizerName,
        price: payload.price ?? defaultEvent.price
      }),
      image_url: payload.imageUrl ?? defaultEvent.image,
      image_urls: payload.imageUrls ?? defaultEvent.recapImages ?? [defaultEvent.image],
      registration_mode: "google_form",
      registration_target: payload.registrationTarget ?? defaultEvent.registrationTarget ?? null,
      published: Boolean(payload.published),
      source_id: defaultEvent.id,
      sponsors: payload.sponsors ?? defaultEvent.sponsors ?? []
    };
    const existingResult: any = await admin.serviceClient
      .from("events")
      .select("id")
      .eq("source_id", defaultEvent.id)
      .limit(1)
      .maybeSingle();

    const existingId = (existingResult.data as { id?: string } | null)?.id;
    const writeResult = existingId
      ? await admin.serviceClient.from("events").update({ ...overrideRow, updated_at: new Date().toISOString() }).eq("id", existingId)
      : await admin.serviceClient.from("events").insert(overrideRow);

    if (!writeResult.error) return NextResponse.json({ ok: true });

    const fallbackDescription = withEventMediaMarker(payload.description ?? defaultEvent.description, payload.imageUrls ?? defaultEvent.recapImages ?? [defaultEvent.image], payload.sponsors ?? defaultEvent.sponsors ?? [], defaultEvent.id, false, {
      agenda: payload.agenda ?? defaultEvent.agenda,
      applicationDeadline: payload.applicationDeadline ?? defaultEvent.applicationDeadline,
      audience: payload.audience ?? defaultEvent.audience,
      organizerLogo: payload.organizerLogo ?? defaultEvent.organizerLogo,
      organizerName: payload.organizerName ?? defaultEvent.organizerName,
      price: payload.price ?? defaultEvent.price
    });
    const fallbackRow = {
      title: overrideRow.title,
      starts_at: overrideRow.starts_at,
      location: overrideRow.location,
      description: fallbackDescription,
      registration_mode: "google_form",
      registration_target: overrideRow.registration_target,
      published: overrideRow.published
    };
    const fallbackExisting: any = await admin.serviceClient
      .from("events")
      .select("id,description")
      .order("updated_at", { ascending: false })
      .limit(50);
    const fallbackExistingId = ((fallbackExisting.data ?? []) as AdminEventRecord[])
      .find((event) => parseEventMediaDescription(event.description).sourceId === defaultEvent.id)?.id;
    const fallbackWrite = fallbackExistingId
      ? await admin.serviceClient.from("events").update({ ...fallbackRow, updated_at: new Date().toISOString() }).eq("id", fallbackExistingId)
      : await admin.serviceClient.from("events").insert(fallbackRow);

    if (fallbackWrite.error) return NextResponse.json({ error: fallbackWrite.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = {};
  if ("title" in payload) patch.title = payload.title;
  if ("startsAt" in payload) patch.starts_at = payload.startsAt;
  if ("location" in payload) patch.location = payload.location;
  if ("description" in payload) {
    patch.description = withEventMediaMarker(payload.description, payload.imageUrls ?? [], payload.sponsors ?? [], null, false, {
      agenda: payload.agenda,
      applicationDeadline: payload.applicationDeadline,
      audience: payload.audience,
      organizerLogo: payload.organizerLogo,
      organizerName: payload.organizerName,
      price: payload.price
    });
  }
  if ("imageUrl" in payload) patch.image_url = payload.imageUrl;
  if ("imageUrls" in payload) patch.image_urls = payload.imageUrls ?? [];
  if ("published" in payload) patch.published = Boolean(payload.published);
  if ("sponsors" in payload) patch.sponsors = payload.sponsors ?? [];
  if ("registrationTarget" in payload) {
    if (payload.registrationTarget && !isGoogleFormUrl(payload.registrationTarget)) {
      return NextResponse.json({ error: "올바른 Google Form 링크를 입력해주세요." }, { status: 400 });
    }
    patch.registration_mode = "google_form";
    patch.registration_target = payload.registrationTarget;
  }

  let { error } = await admin.serviceClient
    .from("events")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", payload.id);

  if (error && /(image_url|image_urls|sponsors)/i.test(error.message)) {
    const fallbackPatch = { ...patch };
    const imageUrls = Array.isArray(payload.imageUrls) ? payload.imageUrls : [];
    const sponsors = Array.isArray(payload.sponsors) ? payload.sponsors : [];
    delete fallbackPatch.image_url;
    delete fallbackPatch.image_urls;
    delete fallbackPatch.sponsors;
    if ("description" in payload) fallbackPatch.description = withEventMediaMarker(payload.description, imageUrls, sponsors, null, false, {
      agenda: payload.agenda,
      applicationDeadline: payload.applicationDeadline,
      audience: payload.audience,
      organizerLogo: payload.organizerLogo,
      organizerName: payload.organizerName,
      price: payload.price
    });
    error = (await admin.serviceClient
      .from("events")
      .update({ ...fallbackPatch, updated_at: new Date().toISOString() })
      .eq("id", payload.id)).error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "삭제할 행사를 찾을 수 없습니다." }, { status: 400 });

  const defaultEvent = defaultEventForId(id);
  if (defaultEvent) {
    const deletedRow = {
      title: defaultEvent.title,
      starts_at: startsAtFromDefaultEvent(defaultEvent.date, defaultEvent.time),
      location: defaultEvent.location,
      description: withEventMediaMarker("", [], [], defaultEvent.id, true),
      registration_mode: "google_form",
      registration_target: defaultEvent.registrationTarget ?? null,
      published: false,
      source_id: defaultEvent.id,
      sponsors: []
    };
    const existingResult: any = await admin.serviceClient
      .from("events")
      .select("id")
      .eq("source_id", defaultEvent.id)
      .limit(1)
      .maybeSingle();
    const existingId = (existingResult.data as { id?: string } | null)?.id;
    const writeResult = existingId
      ? await admin.serviceClient.from("events").update({ ...deletedRow, updated_at: new Date().toISOString() }).eq("id", existingId)
      : await admin.serviceClient.from("events").insert(deletedRow);

    if (!writeResult.error) return NextResponse.json({ ok: true });

    const fallbackRow = {
      title: deletedRow.title,
      starts_at: deletedRow.starts_at,
      location: deletedRow.location,
      description: deletedRow.description,
      registration_mode: "google_form",
      registration_target: deletedRow.registration_target,
      published: false
    };
    const fallbackExisting: any = await admin.serviceClient
      .from("events")
      .select("id,description")
      .order("updated_at", { ascending: false })
      .limit(50);
    const fallbackExistingId = ((fallbackExisting.data ?? []) as AdminEventRecord[])
      .find((event) => parseEventMediaDescription(event.description).sourceId === defaultEvent.id)?.id;
    const fallbackWrite = fallbackExistingId
      ? await admin.serviceClient.from("events").update({ ...fallbackRow, updated_at: new Date().toISOString() }).eq("id", fallbackExistingId)
      : await admin.serviceClient.from("events").insert(fallbackRow);

    if (fallbackWrite.error) return NextResponse.json({ error: fallbackWrite.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await admin.serviceClient.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
