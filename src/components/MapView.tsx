import { MapContainer, Circle, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect } from "react";
import { inRegion, REGION_BOUNDS } from "../lib/geo";
import type { Gathering } from "../types";

type Props = {
  center: { lat: number; lng: number };
  gatherings: Gathering[];
  selected?: Gathering | null;
  draft?: { lat: number; lng: number } | null;
  onSelect?: (id: string) => void;
  onPick?: (lat: number, lng: number) => void;
};

function FlyTo({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    if (inRegion(center.lat, center.lng)) {
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 11), { duration: 0.6 });
    }
    return () => window.clearTimeout(timer);
  }, [center.lat, center.lng, map]);
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

function pinIcon(avatar: string, active = false) {
  return divIcon({
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div style="width:44px;height:44px;border-radius:50%;padding:3px;background:${active ? "#c45c26" : "#1b1713"};box-shadow:0 8px 20px rgba(27,23,19,.16)"><img src="${avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/></div>`,
  });
}

export function MapView({ center, gatherings, selected, draft, onSelect, onPick }: Props) {
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
      <FlyTo center={center} />
      <PickLayer onPick={onPick} />
      {gatherings.map((gathering) => (
        <Marker
          key={gathering.id}
          position={[gathering.lat, gathering.lng]}
          icon={pinIcon(gathering.host?.avatar || "", selected?.id === gathering.id)}
          eventHandlers={{ click: () => onSelect?.(gathering.id) }}
        />
      ))}
      {gatherings.map((gathering) => (
        <Circle
          key={`${gathering.id}-zone`}
          center={[gathering.lat, gathering.lng]}
          radius={360}
          pathOptions={{
            color: selected?.id === gathering.id ? "#c45c26" : "#c4b6a6",
            weight: 1,
            fillColor: selected?.id === gathering.id ? "#c45c26" : "#d8cfc4",
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
