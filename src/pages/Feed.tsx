import { useEffect, useMemo, useState } from "react";
import { GatheringCard } from "../components/GatheringCard";
import { PersonCard } from "../components/PersonCard";
import { api } from "../lib/api";
import { isSoon, kmDistance } from "../lib/geo";
import { useApp } from "../store";
import { INTERESTS, RADII } from "../types";

export function Feed() {
  const { people, gatherings, radius, setRadius, refresh, origin } = useApp();
  const [tab, setTab] = useState<"today" | "now" | "groups">("today");
  const [interest, setInterest] = useState<string>("");

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      if (interest && !person.interests.includes(interest)) return false;
      if (tab === "now") return !person.freeAfter || isSoon(person.freeAfter);
      return true;
    });
  }, [people, interest, tab]);

  const filteredGatherings = useMemo(() => {
    return gatherings.filter((item) => {
      if (kmDistance(origin, { lat: item.lat, lng: item.lng }) > radius) return false;
      if (interest && item.activity !== interest) return false;
      if (tab === "now") return item.mode === "now" || isSoon(item.when);
      return true;
    });
  }, [gatherings, interest, tab, origin, radius]);

  async function invite(id: string) {
    await api.invite(id);
    await refresh();
  }

  async function interestIn(id: string) {
    await api.interest(id);
    await refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-8 pt-10 md:max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">Київ і область</p>
      <h1 className="mt-2 font-display text-3xl leading-tight">Хто сьогодні хоче потусити?</h1>
      <div className="mt-4 flex gap-2">
        {[
          ["today", "Сьогодні"],
          ["now", "Зараз"],
          ["groups", "Збори"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`rounded-full px-3 py-1.5 text-sm ${tab === id ? "bg-ink text-white" : "border border-line bg-card"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {RADII.map((item) => (
          <button
            key={item}
            onClick={() => setRadius(item)}
            className={`rounded-full px-3 py-1.5 text-sm ${radius === item ? "bg-clay text-white" : "border border-line bg-card"}`}
          >
            {item} км
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setInterest("")}
          className={`rounded-full px-3 py-1.5 text-sm ${!interest ? "bg-clay-soft text-clay" : "border border-line bg-card"}`}
        >
          Усі
        </button>
        {INTERESTS.map((item) => (
          <button
            key={item.id}
            onClick={() => setInterest(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${interest === item.id ? "bg-clay-soft text-clay" : "border border-line bg-card"}`}
          >
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      {tab !== "groups" ? (
        <section className="mt-6 space-y-3">
          {filteredPeople.length ? (
            filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onInvite={() => void invite(person.id)}
                onInterest={() => void interestIn(person.id)}
              />
            ))
          ) : (
            <p className="text-sm text-mute">Поруч поки тихо. Створи збір або увімкни «вільний сьогодні».</p>
          )}
        </section>
      ) : null}

      <section className="mt-6 space-y-3">
        <h2 className="font-display text-xl">{tab === "groups" ? "Групові зустрічі" : "Або приєднайся до збору"}</h2>
        {filteredGatherings.length ? (
          filteredGatherings.map((item) => <GatheringCard key={item.id} gathering={item} />)
        ) : (
          <p className="text-sm text-mute">Немає відкритих зборів у цьому радіусі.</p>
        )}
      </section>
    </main>
  );
}
