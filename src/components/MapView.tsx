import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect } from "react";
import { inRegion, REGION_BOUNDS } from "../lib/geo";
import type { Gathering, Person } from "../types";

type Props = {
  center: { lat: number; lng: number };
  gatherings?: Gathering[];
  people?: Person[];
  selectedId?: string | null;
  draft?: { lat: number; lng: number } | null;
  fly?: boolean;
  onSelect?: (kind: "person" | "gathering", id: string) => void;
  onPick?: (lat: number, lng: number) => void;
};

function FlyTo({ center, enabled }: { center: { lat: number; lng: number }; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    if (enabled && inRegion(center.lat, center.lng)) {
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
    }
    return () => window.clearTimeout(timer);
  }, [center.lat, center.lng, enabled, map]);
  return null;
}

function PickLayer({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function pinIcon(avatar: string, name: string, rating?: number, active = false) {
  const ring = active ? "#c45c26" : "#1b1713";
  const letter = escapeAttr((name.trim()[0] || "?").toUpperCase());
  const src = escapeAttr(avatar || "");
  const inner = src
    ? `<img src="${src}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>`
    : `<div style="display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:#c45c26;color:#fff;font:700 16px Manrope,sans-serif">${letter}</div>`;
  const badge = rating
    ? `<span style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);background:#1b1713;color:#fff;border-radius:999px;font:700 10px Manrope,sans-serif;padding:2px 6px;white-space:nowrap">★ ${rating}</span>`
    : "";
  return divIcon({
    className: "",
    iconSize: [48, 56],
    iconAnchor: [24, 28],
    html: `<div style="position:relative;width:48px;height:48px;border-radius:50%;padding:3px;background:${ring};box-shadow:0 8px 20px rgba(27,23,19,.16)">${inner}${badge}</div>`,
  });
}

function draftIcon() {
  return divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#c45c26;border:3px solid #fff;box-shadow:0 6px 16px rgba(196,92,38,.35)"></div>`,
  });
}

export function MapView({
  center,
  gatherings = [],
  people = [],
  selectedId,
  draft,
  fly = true,
  onSelect,
  onPick,
}: Props) {
  const hosted = new Set(people.map((person) => person.id));
  const extraGatherings = gatherings.filter((item) => !hosted.has(item.hostId));

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      minZoom={8}
      maxZoom={18}
      maxBounds={REGION_BOUNDS}
      maxBoundsViscosity={1}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo center={center} enabled={fly} />
      <PickLayer onPick={onPick} />
      {people.map((person) =>
        person.lat && person.lng ? (
          <Marker
            key={`person-${person.id}`}
            position={[person.lat, person.lng]}
            icon={pinIcon(person.avatar, person.name, person.rating, selectedId === person.id)}
            eventHandlers={{
              click: (event) => {
                event.originalEvent.stopPropagation();
                onSelect?.("person", person.id);
              },
            }}
          />
        ) : null,
      )}
      {extraGatherings.map((gathering) => (
        <Marker
          key={`g-${gathering.id}`}
          position={[gathering.lat, gathering.lng]}
          icon={pinIcon(gathering.host?.avatar || "", gathering.host?.name || "Гість", gathering.host?.rating, selectedId === gathering.id)}
          eventHandlers={{
            click: (event) => {
              event.originalEvent.stopPropagation();
              onSelect?.("gathering", gathering.id);
            },
          }}
        />
      ))}
      {draft ? <Marker position={[draft.lat, draft.lng]} icon={draftIcon()} /> : null}
    </MapContainer>
  );
}
