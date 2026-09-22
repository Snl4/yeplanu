import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { GatheringCard } from "../components/GatheringCard";
import { api } from "../lib/api";
import { getPosition, inRegion } from "../lib/geo";
import { interestMeta } from "../types";
import { useApp } from "../store";

export function Profile() {
  const navigate = useNavigate();
  const { user, gatherings, invites, logout, setUser, refresh } = useApp();
  const [freeAfter, setFreeAfter] = useState(user?.freeAfter || "19:00");
  const [error, setError] = useState("");
  const mine = gatherings.filter((item) => item.hostId === user?.id);
  const joined = gatherings.filter((item) => user && item.participantIds.includes(user.id) && item.hostId !== user.id);

  if (!user) return null;

  async function toggleLooking() {
    if (!user) return;
    setError("");
    try {
      let lat = user.lat;
      let lng = user.lng;
      if (!user.looking) {
        const position = await getPosition();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        if (!inRegion(lat, lng)) {
          setError("Поки лише Київ і область.");
          return;
        }
      }
      const next = await api.status({
        looking: !user.looking,
        freeAfter,
        lat,
        lng,
        district: user.district,
      });
      setUser(next);
      await refresh();
    } catch {
      setError("Увімкни гео або постав район у зборі.");
    }
  }

  return (
    <main className="page-wrap grid gap-6 md:grid-cols-[340px_minmax(0,1fr)] md:items-start">
      <aside className="space-y-4">
        <div className="rounded-3xl border border-line bg-card p-5">
          <Avatar src={user.avatar} name={user.name} size={84} />
          <p className="mt-4 text-xs text-mute">
            {user.verified ? "перевірений" : "без перевірки"}
            {user.phoneVerified ? " · телефон" : ""}
            {user.rating ? ` · ★ ${user.rating} (${user.ratingsCount})` : " · без рейтингу"}
          </p>
          <h1 className="font-display text-3xl">
            {user.name}{user.age ? `, ${user.age}` : ""}
          </h1>
          <p className="mt-1 text-mute">📍 Київ{user.district ? `, ${user.district}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.interests.map((id) => {
              const item = interestMeta(id);
              return (
                <span key={id} className="rounded-full bg-clay-soft px-3 py-1 text-sm text-clay">
                  {item.emoji} {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <section className="rounded-3xl border border-line bg-card p-4">
          <p className="font-display text-lg">Вільний сьогодні</p>
          <label className="mt-3 grid gap-2 text-xs font-bold uppercase text-mute">
            Після котрої
            <input type="time" value={freeAfter} onChange={(event) => setFreeAfter(event.target.value)} className="rounded-2xl border border-line px-3 py-2 text-base text-ink" />
          </label>
          <button onClick={() => void toggleLooking()} className={`mt-3 w-full rounded-2xl py-3 font-semibold ${user.looking ? "bg-ink text-white" : "bg-clay text-white"}`}>
            {user.looking ? "Приховати мене зі стрічки" : "Показати в стрічці"}
          </button>
          {error ? <p className="mt-2 text-sm text-clay">{error}</p> : null}
        </section>

        <div className="grid gap-2">
          {!user.verified ? (
            <button onClick={() => navigate("/verify")} className="rounded-2xl bg-clay py-3 text-white">Пройти перевірку</button>
          ) : null}
          <button onClick={() => navigate("/create")} className="rounded-2xl bg-ink py-3 text-white">Створити збір</button>
          <button onClick={() => { logout(); navigate("/login"); }} className="rounded-2xl border border-line py-3">Вийти</button>
        </div>
      </aside>

      <div className="space-y-6">
        {invites.length ? (
          <section className="space-y-2">
            <h2 className="font-display text-lg">Запрошення</h2>
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-2xl border border-line bg-card px-3 py-3">
                <span>{invite.from?.name} кличе потусити</span>
                <div className="flex gap-2">
                  <button className="text-sm text-clay" onClick={() => void api.answerInvite(invite.id, "accepted").then(() => refresh())}>Ок</button>
                  <button className="text-sm text-mute" onClick={() => void api.answerInvite(invite.id, "declined").then(() => refresh())}>Ні</button>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <div className="space-y-2">
          <h2 className="font-display text-lg">Мої збори</h2>
          {mine.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {mine.map((item) => <GatheringCard key={item.id} gathering={item} />)}
            </div>
          ) : <p className="text-sm text-mute">Порожньо</p>}
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-lg">Я з кимось</h2>
          {joined.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {joined.map((item) => <GatheringCard key={item.id} gathering={item} />)}
            </div>
          ) : <p className="text-sm text-mute">Ще не приєднувався</p>}
        </div>
      </div>
    </main>
  );
}
