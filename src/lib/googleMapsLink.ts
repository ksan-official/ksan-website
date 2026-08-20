export type ParsedGoogleMapsLink = {
  address?: string | null;
  latitude: number;
  longitude: number;
  name?: string | null;
  url: string;
};

const exactCoordinatePatterns = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/
];

const viewportCoordinatePatterns = [
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
];

function toFiniteCoordinate(value: string) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function validCoordinates(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function coordinatesFromPatterns(url: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (!match) continue;

    const latitude = toFiniteCoordinate(match[1]);
    const longitude = toFiniteCoordinate(match[2]);

    if (validCoordinates(latitude, longitude)) {
      return { latitude: latitude!, longitude: longitude! };
    }
  }

  return null;
}

export function extractGoogleMapsCoordinates(url: string) {
  try {
    const parsedUrl = new URL(url);
    const coordinateParam =
      parsedUrl.searchParams.get("q") ??
      parsedUrl.searchParams.get("query") ??
      parsedUrl.searchParams.get("ll") ??
      parsedUrl.searchParams.get("destination");
    const coordinateMatch = coordinateParam?.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);

    if (coordinateMatch) {
      const latitude = toFiniteCoordinate(coordinateMatch[1]);
      const longitude = toFiniteCoordinate(coordinateMatch[2]);

      if (validCoordinates(latitude, longitude)) {
        return { latitude: latitude!, longitude: longitude! };
      }
    }
  } catch {
    // Continue with string pattern parsing for non-standard Google Maps URLs.
  }

  return coordinatesFromPatterns(url, exactCoordinatePatterns) ?? coordinatesFromPatterns(url, viewportCoordinatePatterns);
}

function cleanName(value: string) {
  return decodeURIComponent(value)
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractName(url: string) {
  try {
    const parsedUrl = new URL(url);
    const placeMatch = parsedUrl.pathname.match(/\/maps\/place\/([^/]+)/);
    if (placeMatch) {
      return cleanName(placeMatch[1]);
    }

    const queryName = parsedUrl.searchParams.get("q") ?? parsedUrl.searchParams.get("query");
    if (queryName && !/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(queryName)) {
      return cleanName(queryName);
    }
  } catch {
    return null;
  }

  return null;
}

async function resolveGoogleMapsUrl(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal
    });
    return response.url || url;
  } catch {
    return url;
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseGoogleMapsLink(rawUrl: string): Promise<ParsedGoogleMapsLink | null> {
  const initialUrl = rawUrl.trim();
  if (!initialUrl) return null;

  let parsedInitialUrl: URL;
  try {
    parsedInitialUrl = new URL(initialUrl);
  } catch {
    return null;
  }

  const hostname = parsedInitialUrl.hostname.toLowerCase();
  const isGoogleMapsUrl =
    hostname === "maps.app.goo.gl" ||
    hostname.endsWith("google.com") ||
    hostname.endsWith("google.nl") ||
    hostname.endsWith("goo.gl");

  if (!isGoogleMapsUrl) {
    return null;
  }

  const resolvedUrl = await resolveGoogleMapsUrl(initialUrl);
  const coordinates = extractGoogleMapsCoordinates(resolvedUrl) ?? extractGoogleMapsCoordinates(initialUrl);

  if (!coordinates) {
    return null;
  }

  return {
    ...coordinates,
    name: extractName(resolvedUrl) ?? extractName(initialUrl),
    url: resolvedUrl
  };
}
