import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { api } from "../lib/api";
import { interestMeta, type DirectMessage, type ProfileView } from "../types";
import { useApp } from "../store";

export function UserPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const me = useApp((state) => state.user);
  const writeRef = useRef<HTMLTextAreaElement>(null);
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [text, setText] = useState("");
  const [score, setScore] = useState(5);
  const [review, setReview] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    if (!id) return;
    setProfile(await api.profile(id));
    setMessages(await api.dms(id).catch(() => []));
  }

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    if (params.get("write")) writeRef.current?.focus();
  }, [params, profile]);

  if (me && id === me.id) return <Navigate to="/profile" replace />;
  if (!profile) return <p className="page-wrap text-mute">Завантажуємо профіль…</p>;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!id || !text.trim()) return;
    setMessages(await api.dm(id, text));
    setText("");
    setNote("Написано.");
  }

  async function leaveReview(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    try {
      setProfile(await api.review(id, score, review));
      setReview("");
      setNote("Відгук збережено.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося залишити відгук");
    }
  }

  async function report(event: FormEvent) {
    event.preventDefault();
    if (!id || !reason.trim()) return;
    try {
      await api.report(id, reason);
      setReason("");
      setNote("Скаргу надіслано. Подивимось.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати скаргу");
    }
  }

  return (
    <main className="page-wrap grid gap-6 md:grid-cols-[340px_minmax(0,1fr)] md:items-start">
      <aside className="space-y-4">
        <div className="rounded-3xl border border-line bg-card p-5">
          <Avatar src={profile.avatar} name={profile.name} size={84} rating={profile.rating} />
          <p className="mt-4 text-xs text-mute">
            {profile.verified ? "перевірений" : "без перевірки"}
            {profile.rating ? ` · ★ ${profile.rating} (${profile.ratingsCount})` : " · без рейтингу"}
          </p>
          <h1 className="font-display text-3xl">
            {profile.name}{profile.age ? `, ${profile.age}` : ""}
          </h1>
          <p className="mt-1 text-mute">📍 {profile.city || "Київ"}{profile.district ? `, ${profile.district}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.interests.map((item) => {
              const meta = interestMeta(item);
              return (
                <span key={item} className="rounded-full bg-clay-soft px-3 py-1 text-sm text-clay">
                  {meta.emoji} {meta.label}
                </span>
              );
            })}
          </div>
        </div>
        <Link to="/map" className="block rounded-2xl border border-line bg-card py-3 text-center">
          Показати на карті
        </Link>
      </aside>

      <div className="space-y-6">
        {note ? <p className="text-sm text-clay">{note}</p> : null}
        {error ? <p className="text-sm text-clay">{error}</p> : null}

        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-xl">Написати</h2>
          <div className="mt-3 space-y-2">
            {messages.length ? (
              messages.map((message) => (
                <div key={message.id} className="rounded-2xl bg-paper px-3 py-2">
                  <p className="text-xs text-mute">{message.from?.name}</p>
                  <p>{message.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-mute">Поки тиша. Напиши першим.</p>
            )}
          </div>
          <form className="mt-3 grid gap-2" onSubmit={(event) => void send(event)}>
            <textarea
              ref={writeRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-24 rounded-2xl border border-line bg-paper px-4 py-3"
              placeholder="Коротко, без зайвого"
            />
            <button className="rounded-2xl bg-ink py-3 font-semibold text-white">Надіслати</button>
          </form>
        </section>

        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-xl">Відгуки</h2>
          <div className="mt-3 space-y-2">
            {profile.reviews.length ? (
              profile.reviews.map((item, index) => (
                <article key={`${item.fromId}-${index}`} className="rounded-2xl bg-paper px-3 py-3">
                  <p className="text-sm font-semibold">
                    {item.from?.name ?? "Хтось"} · ★ {item.score}
                  </p>
                  {item.text ? <p className="mt-1 text-sm text-mute">{item.text}</p> : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-mute">Відгуків ще немає.</p>
            )}
          </div>
          <form className="mt-4 grid gap-2" onSubmit={(event) => void leaveReview(event)}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setScore(item)}
                  className={`rounded-full px-2 py-1 text-sm ${score === item ? "bg-ink text-white" : "border border-line"}`}
                >
                  ★{item}
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              className="min-h-20 rounded-2xl border border-line bg-paper px-4 py-3"
              placeholder="Як минула зустріч"
            />
            <button className="rounded-2xl border border-line py-3 font-semibold">Залишити відгук</button>
          </form>
        </section>

        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-xl">Подати скаргу</h2>
          <p className="mt-1 text-sm text-mute">Якщо людина токсична, фейк або небезпечна — напиши коротко.</p>
          <form className="mt-3 grid gap-2" onSubmit={(event) => void report(event)}>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-20 rounded-2xl border border-line bg-paper px-4 py-3"
              placeholder="Що сталось"
            />
            <button className="rounded-2xl border border-line py-3 font-semibold">Надіслати скаргу</button>
          </form>
        </section>
      </div>
    </main>
  );
}
