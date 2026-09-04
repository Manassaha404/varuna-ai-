import { tool } from "@openai/agents";
import { z } from "zod";

interface MarinePA {
  name: string;
  desig: string;
  iucnCat: string;
  state: string;
  lat: number;
  lon: number;
  radiusKm: number;
  fishingAllowed: boolean;
  notes: string;
}

const INDIA_MARINE_PAS: MarinePA[] = [
  {
    name: "Mahatma Gandhi Marine National Park",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 11.55,
    lon: 92.67,
    radiusKm: 30,
    fishingAllowed: false,
    notes:
      "No-take zone. Coral reefs, sea turtles. Fishing strictly prohibited.",
  },
  {
    name: "Rani Jhansi Marine National Park",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 12.93,
    lon: 92.97,
    radiusKm: 22,
    fishingAllowed: false,
    notes: "Rich coral reef ecosystem. No fishing permitted.",
  },
  {
    name: "South Button Marine National Park",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 12.05,
    lon: 92.98,
    radiusKm: 6,
    fishingAllowed: false,
    notes: "Small island national park. No fishing.",
  },
  {
    name: "North Button Marine National Park",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 12.68,
    lon: 92.98,
    radiusKm: 5,
    fishingAllowed: false,
    notes: "No fishing permitted.",
  },
  {
    name: "Middle Button Marine National Park",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 12.32,
    lon: 92.98,
    radiusKm: 4,
    fishingAllowed: false,
    notes: "No fishing permitted.",
  },
  {
    name: "Galathea National Park",
    desig: "National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 7.02,
    lon: 93.87,
    radiusKm: 25,
    fishingAllowed: false,
    notes: "Critical leatherback turtle nesting site. No fishing.",
  },
  {
    name: "Campbell Bay National Park",
    desig: "National Park",
    iucnCat: "II",
    state: "Andaman & Nicobar Islands",
    lat: 6.98,
    lon: 93.91,
    radiusKm: 20,
    fishingAllowed: false,
    notes: "Southern tip — no fishing within park boundaries.",
  },
  {
    name: "Pitti Bird Sanctuary",
    desig: "Wildlife Sanctuary",
    iucnCat: "IV",
    state: "Lakshadweep",
    lat: 11.67,
    lon: 72.22,
    radiusKm: 5,
    fishingAllowed: false,
    notes: "Important seabird colony. Fishing restricted within sanctuary.",
  },
  {
    name: "Lakshadweep Biosphere Reserve",
    desig: "Biosphere Reserve",
    iucnCat: "VI",
    state: "Lakshadweep",
    lat: 11.0,
    lon: 73.0,
    radiusKm: 120,
    fishingAllowed: true,
    notes:
      "Traditional fishing allowed with regulations. Commercial trawling restricted.",
  },
  {
    name: "Marine National Park, Gulf of Kutch",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Gujarat",
    lat: 22.58,
    lon: 69.83,
    radiusKm: 45,
    fishingAllowed: false,
    notes:
      "First marine national park in India. Mangroves, coral reefs. No fishing.",
  },
  {
    name: "Marine Wildlife Sanctuary, Gulf of Kutch",
    desig: "Marine Wildlife Sanctuary",
    iucnCat: "IV",
    state: "Gujarat",
    lat: 22.45,
    lon: 69.65,
    radiusKm: 35,
    fishingAllowed: false,
    notes: "Buffer around national park. Fishing highly regulated.",
  },
  {
    name: "Gulf of Mannar Marine National Park",
    desig: "Marine National Park",
    iucnCat: "II",
    state: "Tamil Nadu",
    lat: 9.12,
    lon: 79.15,
    radiusKm: 50,
    fishingAllowed: false,
    notes: "21 islands, coral reefs, seagrass beds. No fishing inside park.",
  },
  {
    name: "Gulf of Mannar Biosphere Reserve",
    desig: "Biosphere Reserve",
    iucnCat: "VI",
    state: "Tamil Nadu",
    lat: 9.25,
    lon: 79.2,
    radiusKm: 80,
    fishingAllowed: true,
    notes:
      "Traditional fishing allowed in buffer zone. Trawling restricted near islands.",
  },
  {
    name: "Point Calimere Wildlife Sanctuary",
    desig: "Wildlife Sanctuary",
    iucnCat: "IV",
    state: "Tamil Nadu",
    lat: 10.28,
    lon: 79.88,
    radiusKm: 18,
    fishingAllowed: false,
    notes: "Flamingo and migratory bird habitat. No fishing in tidal areas.",
  },
  // ── Kerala ───────────────────────────────────────────────────────────────
  {
    name: "Vembanad Wetland (Ramsar Site)",
    desig: "Ramsar Wetland",
    iucnCat: "VI",
    state: "Kerala",
    lat: 9.6,
    lon: 76.38,
    radiusKm: 30,
    fishingAllowed: true,
    notes: "Traditional fishing allowed. Conservation regulations apply.",
  },
  {
    name: "Ashtamudi Wetland (Ramsar Site)",
    desig: "Ramsar Wetland",
    iucnCat: "VI",
    state: "Kerala",
    lat: 8.93,
    lon: 76.57,
    radiusKm: 15,
    fishingAllowed: true,
    notes: "Clam and fish harvesting regulated. Check local rules.",
  },
  // ── Odisha ───────────────────────────────────────────────────────────────
  {
    name: "Bhitarkanika Marine Sanctuary",
    desig: "Wildlife Sanctuary",
    iucnCat: "IV",
    state: "Odisha",
    lat: 20.72,
    lon: 87.0,
    radiusKm: 25,
    fishingAllowed: false,
    notes: "Saltwater crocodile & mangrove habitat. No fishing.",
  },
  {
    name: "Gahirmatha Marine Sanctuary",
    desig: "Marine Sanctuary",
    iucnCat: "IV",
    state: "Odisha",
    lat: 20.87,
    lon: 87.13,
    radiusKm: 40,
    fishingAllowed: false,
    notes:
      "World's largest Olive Ridley sea turtle rookery. Fishing banned Nov–May.",
  },
  {
    name: "Chilika Lake (Ramsar Site)",
    desig: "Ramsar Wetland",
    iucnCat: "VI",
    state: "Odisha",
    lat: 19.73,
    lon: 85.33,
    radiusKm: 30,
    fishingAllowed: true,
    notes: "Traditional fishing allowed with permits. Trawling restricted.",
  },
  // ── West Bengal ──────────────────────────────────────────────────────────
  {
    name: "Sundarbans National Park (Marine Buffer)",
    desig: "National Park / World Heritage Site",
    iucnCat: "II",
    state: "West Bengal",
    lat: 21.93,
    lon: 88.88,
    radiusKm: 50,
    fishingAllowed: false,
    notes: "Tiger reserve. No fishing in core zone. Buffer zone regulated.",
  },
  // ── Andhra Pradesh ───────────────────────────────────────────────────────
  {
    name: "Coringa Wildlife Sanctuary",
    desig: "Wildlife Sanctuary",
    iucnCat: "IV",
    state: "Andhra Pradesh",
    lat: 16.73,
    lon: 82.23,
    radiusKm: 20,
    fishingAllowed: false,
    notes: "Second largest mangrove forest in India. No commercial fishing.",
  },
  {
    name: "Krishna Wildlife Sanctuary",
    desig: "Wildlife Sanctuary",
    iucnCat: "IV",
    state: "Andhra Pradesh",
    lat: 15.77,
    lon: 80.87,
    radiusKm: 15,
    fishingAllowed: false,
    notes: "Mangroves and sea turtle habitat. Fishing restricted.",
  },
  // ── Goa ──────────────────────────────────────────────────────────────────
  {
    name: "Goa Coastal Zone (CRZ-I Notified)",
    desig: "Coastal Regulation Zone",
    iucnCat: "VI",
    state: "Goa",
    lat: 15.5,
    lon: 73.83,
    radiusKm: 10,
    fishingAllowed: true,
    notes:
      "CRZ-I areas restrict certain activities. Traditional fishing usually allowed.",
  },
];

export const GeoInputSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Latitude of the query location in decimal degrees"),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude of the query location in decimal degrees"),
  radiusKm: z
    .number()
    .optional()
    .describe("Search radius in kilometres (default: 100 km)"),
});

type GeoInputType = z.infer<typeof GeoInputSchema>;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── ORCA RFZ API types ────────────────────────────────────────────────────────

interface OrcaZone {
  zone_id: number;
  name: string;
  zone_type: string;
  restricted: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}

interface OrcaMonsoonBan {
  ban_active: boolean;
  ban_period: string;
  checked_date: string;
  coast: string;
}

interface OrcaApiResponse {
  checked_at: string;
  in_restricted_zone: boolean;
  latitude: number;
  longitude: number;
  monsoon_ban: OrcaMonsoonBan;
  total_zones_matched: number;
  zones_found: OrcaZone[];
}

// ── Live ORCA RFZ API call ────────────────────────────────────────────────────

async function fetchOrcaZones(
  latitude: number,
  longitude: number,
): Promise<OrcaApiResponse | null> {
  try {
    const url = `https://orca-rfz-api.onrender.com/check-zone?latitude=${latitude}&longitude=${longitude}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    return (await response.json()) as OrcaApiResponse;
  } catch {
    // API unreachable — degrade gracefully to offline-only data
    return null;
  }
}

// ── Main execute function ─────────────────────────────────────────────────────

const executeFn = async (input: GeoInputType) => {
  const { latitude, longitude, radiusKm = 100 } = input;
  const timestamp = new Date().toISOString();

  // Run offline MPA scan and live API call in parallel
  const [, orcaData] = await Promise.all([
    Promise.resolve(), // placeholder to keep destructuring aligned
    fetchOrcaZones(latitude, longitude),
  ]);

  const results: Array<{
    name: string;
    designation: string;
    iucnCategory: string;
    state: string;
    distanceKm: number;
    isInside: boolean;
    fishingAllowed: boolean;
    notes: string;
    source: "offline" | "orca-api";
  }> = [];

  let isInsideProtectedZone = false;
  let strictestZone: string | null = null;

  // ── Offline MPA scan ──────────────────────────────────────────────────────
  for (const pa of INDIA_MARINE_PAS) {
    const distKm = haversineKm(latitude, longitude, pa.lat, pa.lon);

    const inside = distKm <= pa.radiusKm;
    const nearby = inside || distKm <= radiusKm;

    if (!nearby) continue;

    if (inside) {
      isInsideProtectedZone = true;
      if (!pa.fishingAllowed) {
        strictestZone = pa.name;
      }
    }

    results.push({
      name: pa.name,
      designation: pa.desig,
      iucnCategory: pa.iucnCat,
      state: pa.state,
      distanceKm: Math.round(distKm),
      isInside: inside,
      fishingAllowed: pa.fishingAllowed,
      notes: pa.notes,
      source: "offline",
    });
  }

  // ── Merge ORCA API zones ──────────────────────────────────────────────────
  if (orcaData?.in_restricted_zone) {
    isInsideProtectedZone = true;
  }

  const orcaZones = orcaData?.zones_found ?? [];
  for (const zone of orcaZones) {
    const fishingAllowed = !zone.restricted;
    if (!fishingAllowed && !strictestZone) {
      strictestZone = zone.name;
    }
    results.push({
      name: zone.name,
      designation: zone.zone_type,
      iucnCategory: zone.severity,
      state: "N/A",
      distanceKm: 0, // API confirms exact point is inside the zone
      isInside: true,
      fishingAllowed,
      notes: zone.description || `Severity: ${zone.severity}. Zone ID: ${zone.zone_id}.`,
      source: "orca-api",
    });
  }

  // ── Monsoon ban ───────────────────────────────────────────────────────────
  const monsoonBan = orcaData?.monsoon_ban ?? null;

  // Sort: inside zones first, then by distance
  results.sort((a, b) => {
    if (a.isInside !== b.isInside) return a.isInside ? -1 : 1;
    return a.distanceKm - b.distanceKm;
  });

  const insideZones = results.filter((z) => z.isInside);
  const noFishingZones = results.filter((z) => z.isInside && !z.fishingAllowed);

  // Build summary
  let summary = "";
  if (isInsideProtectedZone) {
    summary =
      `Your location is inside ${insideZones.length} restricted/protected area(s). ` +
      (noFishingZones.length > 0
        ? `Fishing is NOT allowed in: ${noFishingZones.map((z) => z.name).join(", ")}.`
        : "Regulated fishing may be allowed — check local rules.");
  } else {
    summary =
      results.length > 0
        ? `Your location is outside all protected areas. Found ${results.length} MPA(s) within ${radiusKm} km.`
        : `No marine protected areas found within ${radiusKm} km of your location.`;
  }

  if (monsoonBan?.ban_active) {
    summary += ` ⚠️ Monsoon fishing ban is currently ACTIVE on the ${monsoonBan.coast} (${monsoonBan.ban_period}).`;
  } else if (monsoonBan) {
    summary += ` Monsoon ban period for ${monsoonBan.coast}: ${monsoonBan.ban_period} (currently inactive).`;
  }

  return {
    isInsideProtectedZone,
    fishingRestricted: noFishingZones.length > 0,
    strictestZone,
    monsoonBan: monsoonBan
      ? {
          active: monsoonBan.ban_active,
          coast: monsoonBan.coast,
          period: monsoonBan.ban_period,
        }
      : null,
    nearbyZones: results,
    totalZonesFound: results.length,
    insideCount: insideZones.length,
    summary,
    dataSource: orcaData
      ? "Offline MPA dataset + ORCA RFZ live API (https://orca-rfz-api.onrender.com)"
      : "Offline MPA dataset only (ORCA API unavailable)",
    dataTimestamp: timestamp,
  };
};

export const getProtectedFishingSitesTool = tool({
  name: "getProtectedFishingSites",
  description:
    "Checks whether a given location is inside or near Indian marine protected areas, " +
    "wildlife sanctuaries, biosphere reserves, Ramsar wetlands, EEZ zones, or monsoon ban areas. " +
    "Combines an offline curated MPA dataset with a live ORCA RFZ API call for real-time zone data. " +
    "Returns restriction status, fishing rules, monsoon ban info, and a plain-language summary.",
  parameters: GeoInputSchema,
  execute: executeFn,
});

