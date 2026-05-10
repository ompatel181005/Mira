// Simple ZIP geocoder. Tries Nominatim, falls back to a small static table for
// common Cook County ZIPs so the demo path never depends on the network.

const STATIC_ZIPS: Record<string, { lat: number; lng: number }> = {
  "60607": { lat: 41.8745, lng: -87.6516 },
  "60608": { lat: 41.8508, lng: -87.6705 },
  "60612": { lat: 41.8807, lng: -87.6864 },
  "60622": { lat: 41.9024, lng: -87.6797 },
  "60623": { lat: 41.8485, lng: -87.7142 },
  "60624": { lat: 41.8807, lng: -87.7212 },
  "60629": { lat: 41.7762, lng: -87.7117 },
  "60632": { lat: 41.8062, lng: -87.7117 },
  "60639": { lat: 41.9215, lng: -87.7553 },
  "60647": { lat: 41.9210, lng: -87.7000 },
  "60651": { lat: 41.9019, lng: -87.7440 },
  "60653": { lat: 41.8200, lng: -87.6125 },
  "60660": { lat: 41.9907, lng: -87.6611 },
  "60661": { lat: 41.8825, lng: -87.6438 },
};

export async function geocode(zip: string): Promise<{ lat: number; lng: number } | null> {
  if (STATIC_ZIPS[zip]) return STATIC_ZIPS[zip];
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
      zip
    )}&country=us&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MIRA-Healthcare-Navigator/1.0 (contact@example.com)" },
      // 4-second budget so we never hold up the demo
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // fall through
  }
  return null;
}
