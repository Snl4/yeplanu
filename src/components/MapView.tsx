import { MapContainer, Circle, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
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
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 13), { duration: 0.7 });
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

function pinIcon(avatar: string, name: string, active = false, kind: "person" | "gathering" = "gathering") {
  const ring = active ? "#c45c26" : kind === "person" ? "#1b1713" : "#6d655c";
  const letter = escapeAttr((name.trim()[0] || "?").toUpperCase());
  const src = escapeAttr(avatar || "");
  const inner = src
    ? `<img src="${src}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>`
    : `<div style="display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:#c45c26;color:#fff;font:700 16px Manrope,sans-serif">${letter}</div>`;
  return divIcon({
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div style="width:44px;height:44px;border-radius:50%;padding:3px;background:${ring};box-shadow:0 8px 20px rgba(27,23,19,.16)">${inner}</div>`,
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
      zoom={11}
      minZoom={8}
      maxZoom={17}
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
            icon={pinIcon(person.avatar, person.name, selectedId === person.id, "person")}
            eventHandlers={{
              click: (event) => {
                event.originalEvent.stopPropagation();
                onSelect?.("person", person.id);
              },
            }}
          />
        ) : null,
      )}
      {people.map((person) =>
        person.lat && person.lng ? (
          <Circle
            key={`person-zone-${person.id}`}
            center={[person.lat, person.lng]}
            radius={360}
            pathOptions={{
              color: selectedId === person.id ? "#c45c26" : "#c4b6a6",
              weight: 1,
              fillColor: selectedId === person.id ? "#c45c26" : "#d8cfc4",
              fillOpacity: selectedId === person.id ? 0.22 : 0.14,
            }}
          />
        ) : null,
      )}
      {extraGatherings.map((gathering) => (
        <Marker
          key={`g-${gathering.id}`}
          position={[gathering.lat, gathering.lng]}
          icon={pinIcon(gathering.host?.avatar || "", gathering.host?.name || "Гість", selectedId === gathering.id, "gathering")}
          eventHandlers={{
            click: (event) => {
              event.originalEvent.stopPropagation();
              onSelect?.("gathering", gathering.id);
            },
          }}
        />
      ))}
      {extraGatherings.map((gathering) => (
        <Circle
          key={`${gathering.id}-zone`}
          center={[gathering.lat, gathering.lng]}
          radius={360}
          pathOptions={{
            color: selectedId === gathering.id ? "#c45c26" : "#c4b6a6",
            weight: 1,
            fillColor: selectedId === gathering.id ? "#c45c26" : "#d8cfc4",
            fillOpacity: 0.16,
          }}
        />
      ))}
      {draft ? (
        <Circle
          center={[draft.lat, draft.lng]}
          radius={360}
          pathOptions={{ color: "#c45c26", weight: 1.5, fillColor: "#c45c26", fillOpacity: 0.18 }}
        />
      ) : null}
    </MapContainer>
  );
}
