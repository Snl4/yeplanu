import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GatheringCard } from "../components/GatheringCard";
import { MapView } from "../components/MapView";
import { inRegion, kmDistance, KYIV } from "../lib/geo";
import { useApp } from "../store";

export function MapPage() {
  const navigate = useNavigate();
  const { gatherings, refresh, radius } = useApp();
  const [filter, setFilter] = useState<"all" | "now" | "plan">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  const visible = gatherings.filter((item) => {
    if (!inRegion(item.lat, item.lng)) return false;
    if (kmDistance(KYIV, { lat: item.lat, lng: item.lng }) > radius) return false;
    return filter === "all" || item.mode === filter;
  });
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const center = useMemo(() => {
    if (selected) return { lat: selected.lat, lng: selected.lng };
    return KYIV;
  }, [selected]);

  return (
    <div className="relative h-[100dvh] md:h-auto md:min-h-[calc(100dvh-76px)]">
      <div className="absolute inset-0 md:static md:h-[calc(100dvh-76px)] md:flex">
        <div className="h-full md:flex-1">
          <MapView
            center={center}
            gatherings={visible}
            selected={selected}
            onSelect={(id) => {
              setSelectedId(id);
            }}
          />
        </div>
        <aside className="pointer-events-none absolute inset-x-0 top-0 p-4 md:pointer-events-auto md:static md:w-[380px] md:border-l md:border-line md:bg-paper md:p-6">
          <div className="pointer-events-auto rounded-3xl bg-card/95 p-4 shadow-sm backdrop-blur md:bg-transparent md:p-0 md:shadow-none">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-2xl">Київ і область</p>
                <p className="text-xs text-mute">
                  збори на карті · радіус {radius} км
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {[
                ["all", "Усі"],
                ["now", "Зараз"],
                ["plan", "Плани"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as typeof filter)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    filter === id ? "bg-clay text-white" : "border border-line bg-paper"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 hidden max-h-[calc(100dvh-220px)] space-y-2 overflow-auto md:block">
            {visible.length ? (
              visible.map((item) => <GatheringCard key={item.id} gathering={item} />)
            ) : (
              <p className="text-sm text-mute">Поки тиша. Створи перший збір.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[76px] space-y-2 p-3 md:hidden">
        {selected ? (
          <div className="pointer-events-auto" onClick={() => navigate(`/g/${selected.id}`)}>
            <GatheringCard gathering={selected} />
          </div>
        ) : (
          <p className="pointer-events-auto rounded-2xl bg-card/95 px-4 py-3 text-sm text-mute">
            Нікого поруч. Натисни «Збір», якщо хочеш вийти.
          </p>
        )}
      </div>
    </div>
  );
}
