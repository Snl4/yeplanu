export const KYIV = { lat: 50.4501, lng: 30.5234 };

/** Київ + Київська область. Поки працюємо тільки в цьому прямокутнику. */
export const REGION = {
  name: "Київ і область",
  south: 49.18,
  north: 51.55,
  west: 29.27,
  east: 32.18,
};

export const REGION_BOUNDS: [[number, number], [number, number]] = [
  [REGION.south, REGION.west],
  [REGION.north, REGION.east],
];

export function inRegion(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= REGION.south &&
    lat <= REGION.north &&
    lng >= REGION.west &&
    lng <= REGION.east
  );
}

export function fuzz(lat: number, lng: number, meters = 320) {
  const offset = meters / 111320;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * offset;
  return {
    lat: lat + radius * Math.cos(angle),
    lng: lng + (radius * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180),
  };
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Геолокація недоступна"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
    });
  });
}

export function kmDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isSoon(when: string, hours = 4) {
  const date = new Date(when);
  if (Number.isNaN(date.getTime())) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(when);
    if (!match) return true;
    const next = new Date();
    next.setHours(Number(match[1]), Number(match[2]), 0, 0);
    const diff = next.getTime() - Date.now();
    return diff <= hours * 3600_000 && diff >= -30 * 60_000;
  }
  const diff = date.getTime() - Date.now();
  return diff <= hours * 3600_000 && diff >= -30 * 60_000;
}

export function whenLabel(iso: string, mode: "now" | "plan") {
  if (mode === "now") return "йде зараз";
  const date = new Date(iso);
  return date.toLocaleString("uk-UA", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
