import { useEffect, useMemo, useState } from "react";
import { GatheringCard } from "../components/GatheringCard";
import { MapView } from "../components/MapView";
import { PersonOffer } from "../components/PersonOffer";
import { inRegion, isSoon, kmDistance, KYIV } from "../lib/geo";
import { useApp } from "../store";

type Selection =
  | { kind: "person"; id: string }
  | { kind: "gathering"; id: string }
  | null;

export function MapPage() {
  const { gatherings, people, refresh, radius, origin } = useApp();
  const [filter, setFilter] = useState<"all" | "now" | "plan">("all");
  const [selected, setSelected] = useState<Selection>(null);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  const visiblePeople = people.filter((person) => {
    if (!person.lat || !person.lng || !inRegion(person.lat, person.lng)) return false;
    if (kmDistance(origin, { lat: person.lat, lng: person.lng }) > radius) return false;
    if (filter === "plan") return Boolean(person.freeAfter);
    if (filter === "now") return !person.freeAfter || isSoon(person.freeAfter);
    return true;
  });

  const visibleGatherings = gatherings.filter((item) => {
    if (!inRegion(item.lat, item.lng)) return false;
    if (kmDistance(origin, { lat: item.lat, lng: item.lng }) > radius) return false;
    return filter === "all" || item.mode === filter;
  });

  const selectedPerson = selected?.kind === "person"
    ? visiblePeople.find((person) => person.id === selected.id) ?? people.find((person) => person.id === selected.id) ?? null
    : null;
  const selectedGathering = selected?.kind === "gathering"
    ? visibleGatherings.find((item) => item.id === selected.id) ?? gatherings.find((item) => item.id === selected.id) ?? null
    : null;
  const personGatherings = selectedPerson
    ? visibleGatherings.filter((item) => item.hostId === selectedPerson.id)
    : [];

  const center = useMemo(() => {
    if (selectedPerson?.lat && selectedPerson.lng) {
      return { lat: selectedPerson.lat, lng: selectedPerson.lng };
    }
    if (selectedGathering) return { lat: selectedGathering.lat, lng: selectedGathering.lng };
    return KYIV;
  }, [selectedPerson, selectedGathering]);

  const offer = selectedPerson ? (
    <PersonOffer person={selectedPerson} gatherings={personGatherings} />
  ) : selectedGathering ? (
    <GatheringCard gathering={selectedGathering} />
  ) : (
    <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm text-mute">
      Натисни людину на карті — точна точка і що там по планах.
    </p>
  );

  return (
    <div className="relative h-[100dvh] md:h-auto md:min-h-[calc(100dvh-76px)]">
      <div className="absolute inset-0 md:static md:h-[calc(100dvh-76px)] md:flex">
        <div className="h-full md:flex-1">
          <MapView
            center={center}
            fly={Boolean(selected)}
            people={visiblePeople}
            gatherings={visibleGatherings}
            selectedId={selected?.id ?? null}
            onSelect={(kind, id) => setSelected({ kind, id })}
          />
        </div>
        <aside className="pointer-events-none absolute inset-x-0 top-0 p-4 md:pointer-events-auto md:static md:w-[400px] md:border-l md:border-line md:bg-paper md:p-6">
          <div className="pointer-events-auto rounded-3xl bg-card/95 p-4 shadow-sm backdrop-blur md:bg-transparent md:p-0 md:shadow-none">
            <div>
              <p className="font-display text-2xl">Київ і область</p>
              <p className="text-xs text-mute">люди і збори · радіус {radius} км</p>
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
          <div className="pointer-events-auto mt-3 hidden max-h-[calc(100dvh-220px)] space-y-3 overflow-auto md:block">
            {offer}
            {visiblePeople.filter((person) => person.id !== selectedPerson?.id).map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelected({ kind: "person", id: person.id })}
                className="flex w-full items-center justify-between rounded-2xl border border-line bg-card px-3 py-3 text-left"
              >
                <span className="font-semibold">{person.name}{person.age ? `, ${person.age}` : ""}</span>
                <span className="text-sm text-mute">{person.district || person.city}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[76px] space-y-2 p-3 md:hidden">
        <div className="pointer-events-auto">{offer}</div>
      </div>
    </div>
  );
}
