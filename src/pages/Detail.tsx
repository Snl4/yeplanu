import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapView } from "../components/MapView";
import { Avatar } from "../components/Avatar";
import { api } from "../lib/api";
import { whenLabel } from "../lib/geo";
import { useApp } from "../store";
import { interestMeta, type Gathering } from "../types";

export function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refresh } = useApp();
  const [gathering, setGathering] = useState<Gathering | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;
    setGathering(await api.gathering(id));
  }

  useEffect(() => {
    void load();
  }, [id]);

  if (!gathering) {
    return <p className="px-5 pt-16 text-mute">Завантажуємо збір…</p>;
  }

  const joined = Boolean(user && gathering.participantIds.includes(user.id));
  const host = gathering.hostId === user?.id;
  const taken = gathering.participantIds.length;
  const left = Math.max(0, gathering.spots - taken);

  async function join() {
    if (!id) return;
    try {
      setGathering(await api.join(id));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося приєднатись");
    }
  }

  async function close() {
    if (!id) return;
    await api.close(id);
    await refresh();
    navigate("/");
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!id || !text.trim()) return;
    setGathering(await api.message(id, text));
    setText("");
  }

  return (
    <main className="mx-auto max-w-6xl pb-8 md:grid md:grid-cols-2">
      <section className="h-80 md:h-[calc(100dvh-76px)]">
        <MapView
          center={{ lat: gathering.lat, lng: gathering.lng }}
          gatherings={[gathering]}
          selected={gathering}
        />
      </section>
      <section className="px-5 py-6 md:px-8 md:py-10">
        <Link to="/" className="text-sm text-clay">
          Назад до стрічки
        </Link>
        <div className="mt-5 flex items-center gap-3">
          <Avatar src={gathering.host?.avatar} name={gathering.host?.name ?? ""} size={64} />
          <div>
            <p className="text-xs text-mute">
              {gathering.host?.name}
              {gathering.host?.age ? `, ${gathering.host.age}` : ""}
              {gathering.host?.rating ? ` · ★ ${gathering.host.rating}` : ""}
            </p>
            <h1 className="font-display text-2xl">
              {interestMeta(gathering.activity).emoji} {gathering.title}
            </h1>
            <p className="text-sm text-mute">
              {gathering.placeLabel} · {whenLabel(gathering.when, gathering.mode)}
            </p>
          </div>
        </div>
        {gathering.note ? <p className="mt-4 text-mute">{gathering.note}</p> : null}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Fact label="Місце" value="публічне" />
          <Fact label="Локація" value={gathering.placeLabel.split(",")[0]} />
          <Fact label="Нас уже" value={`${taken}/${gathering.spots}`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {gathering.participants.map((person) => (
            <span key={person.id} className="inline-flex items-center gap-2 rounded-full bg-card px-2 py-1 text-xs">
              <Avatar src={person.avatar} name={person.name} size={22} />
              {person.name}
            </span>
          ))}
        </div>
        {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
        {host ? (
          <button onClick={() => void close()} className="mt-5 w-full rounded-2xl border border-line py-3">
            Я вдома · зняти з карти
          </button>
        ) : (
          <button onClick={() => void join()} disabled={joined || left === 0} className="mt-5 w-full rounded-2xl bg-clay py-4 font-semibold text-white disabled:opacity-50">
            {joined ? "Ти вже з ними" : "Приєднатися"}
          </button>
        )}
        {joined ? (
          <div className="mt-5 rounded-3xl border border-line bg-card p-4">
            <p className="font-display">Оціни після зустрічі</p>
            <div className="mt-2 space-y-2">
              {gathering.participants.filter((person) => person.id !== user?.id).map((person) => (
                <div key={person.id} className="flex items-center justify-between gap-2">
                  <span>{person.name}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        className="text-sm"
                        onClick={() => id && void api.rate(person.id, id, score)}
                      >
                        ★{score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-6">
          <h2 className="font-display text-lg">Чат збору</h2>
          <div className="mt-3 space-y-2">
            {gathering.messages.length ? (
              gathering.messages.map((message) => (
                <div key={message.id} className="rounded-2xl bg-card px-3 py-2">
                  <p className="text-xs text-mute">{message.author?.name}</p>
                  <p>{message.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-mute">Поки тихо. Напиши першим.</p>
            )}
          </div>
          {joined ? (
            <form className="mt-3 flex gap-2" onSubmit={send}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="flex-1 rounded-2xl border border-line bg-card px-4 py-3"
                placeholder="Написати…"
              />
              <button className="rounded-2xl bg-ink px-4 text-white">OK</button>
            </form>
          ) : (
            <p className="mt-3 text-xs text-mute">Чат відкриється після «Я з вами».</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
