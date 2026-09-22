import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapView } from "../components/MapView";
import { api } from "../lib/api";
import { fuzz, getPosition, inRegion, KYIV } from "../lib/geo";
import { useApp } from "../store";
import { interestMeta, INTERESTS } from "../types";

export function Create() {
  const navigate = useNavigate();
  const { user, refresh } = useApp();
  const [mode, setMode] = useState<"now" | "plan">("now");
  const [activity, setActivity] = useState("beer");
  const [title, setTitle] = useState("Пиво сьогодні");
  const [note, setNote] = useState("");
  const [spots, setSpots] = useState(5);
  const [when, setWhen] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function locate() {
    setError("");
    try {
      const position = await getPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      if (!inRegion(lat, lng)) {
        setError("Поки працюємо лише в Києві та області. Постав точку на карті.");
        return;
      }
      const next = fuzz(lat, lng);
      setPoint(next);
      const geo = await api.geocode(next.lat, next.lng);
      setPlace(geo.label);
    } catch {
      setError("Немає доступу до гео. Натисни на карті місце зустрічі.");
    }
  }

  async function pick(lat: number, lng: number) {
    if (!inRegion(lat, lng)) {
      setError("Це вже за межами Києва і області.");
      return;
    }
    const next = fuzz(lat, lng, 180);
    setPoint(next);
    setError("");
    const geo = await api.geocode(next.lat, next.lng);
    setPlace(geo.label);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!point) {
      setError("Спочатку постав місце: гео або дотик по карті.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const gathering = await api.create({
        mode,
        activity,
        title: title || `${interestMeta(activity).label} сьогодні`,
        note,
        lat: point.lat,
        lng: point.lng,
        placeLabel: place,
        when: mode === "plan" && when ? new Date(when).toISOString() : new Date().toISOString(),
        spots,
      });
      await refresh();
      navigate(`/g/${gathering.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося опублікувати");
    } finally {
      setPending(false);
    }
  }

  if (user && !user.verified) {
    return (
      <main className="mx-auto max-w-lg px-5 pt-16">
        <h1 className="font-display text-3xl">Спочатку перевірка</h1>
        <p className="mt-3 text-mute">Без неї збір не публікується і локація не світиться.</p>
        <button onClick={() => navigate("/verify")} className="mt-8 w-full rounded-2xl bg-clay py-4 text-white">
          Перейти до перевірки
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl md:grid-cols-2">
      <section className="h-64 md:h-auto">
        <MapView
          center={point ?? KYIV}
          gatherings={[]}
          draft={point}
          onPick={pick}
        />
      </section>
      <form className="flex flex-col gap-4 px-5 py-6" onSubmit={onSubmit}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Новий збір · Київ і область</p>
          <h1 className="mt-2 font-display text-3xl">Збір на вечір</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode("now")} className={`rounded-full px-4 py-2 ${mode === "now" ? "bg-ink text-white" : "border border-line"}`}>
            Йду зараз
          </button>
          <button type="button" onClick={() => setMode("plan")} className={`rounded-full px-4 py-2 ${mode === "plan" ? "bg-ink text-white" : "border border-line"}`}>
            Планую
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActivity(item.id);
                setTitle(`${item.label} сьогодні`);
              }}
              className={`rounded-full px-3 py-2 text-sm ${activity === item.id ? "bg-clay text-white" : "border border-line bg-card"}`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Пішли в Панаму"
          className="rounded-2xl border border-line bg-card px-4 py-3"
        />
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Коротко, навіщо і який вайб"
          className="min-h-24 rounded-2xl border border-line bg-card px-4 py-3"
        />
        {mode === "plan" ? (
          <input
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3"
          />
        ) : null}
        <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
          <span className="text-sm text-mute">Максимум людей</span>
          <input
            type="number"
            min={2}
            max={12}
            value={spots}
            onChange={(event) => setSpots(Number(event.target.value))}
            className="w-16 bg-transparent text-right font-display text-2xl"
          />
        </label>
        <button type="button" onClick={() => void locate()} className="rounded-2xl border border-line bg-card py-3 font-semibold">
          Взяти мою геолокацію
        </button>
        <div className="rounded-2xl bg-clay-soft px-4 py-3 text-sm">
          <p className="font-semibold">{place || "Місце ще не стоїть"}</p>
          <p className="text-mute">
            {point
              ? "На карті буде розмита зона, не під’їзд. Можна тицьнути іншу точку."
              : "Натисни «взяти гео» або ткни карту."}
          </p>
        </div>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <button disabled={pending} className="mt-auto rounded-2xl bg-clay py-4 font-semibold text-white disabled:opacity-60">
          {pending ? "Публікуємо…" : "Опублікувати"}
        </button>
      </form>
    </main>
  );
}
