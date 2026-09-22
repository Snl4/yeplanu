import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { INTERESTS } from "../types";
import { api } from "../lib/api";
import { makeAvatar } from "../lib/avatar";
import { useApp } from "../store";

export function Login() {
  const navigate = useNavigate();
  const login = useApp((state) => state.login);
  const [name, setName] = useState("");
  const [age, setAge] = useState("21");
  const [district, setDistrict] = useState("Оболонь");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<string[]>(["talk"]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function toggle(item: string) {
    setInterests((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const user = await api.login({
        name,
        age: Number(age),
        phone,
        district,
        city: "Київ",
        interests,
        avatar: makeAvatar(name),
      });
      login(user);
      navigate(user.verified ? "/" : "/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося увійти");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8 pt-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Пішли</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">Хто сьогодні хоче потусити?</h1>
      <p className="mt-3 max-w-sm text-mute">
        Люди поруч у Києві та області. Пиво, ігри, кіно, прогулянка — не обов’язково один на один.
      </p>
      <form className="mt-8 flex flex-1 flex-col gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-mute">
          Ім’я
          <input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-line bg-card px-4 py-3 text-base" placeholder="Влад" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-mute">
            Вік
            <input required type="number" min={18} max={80} value={age} onChange={(event) => setAge(event.target.value)} className="rounded-2xl border border-line bg-card px-4 py-3 text-base" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-mute">
            Район
            <input required value={district} onChange={(event) => setDistrict(event.target.value)} className="rounded-2xl border border-line bg-card px-4 py-3 text-base" />
          </label>
        </div>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-mute">
          Телефон
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border border-line bg-card px-4 py-3 text-base" placeholder="+380..." />
        </label>
        <div className="grid gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-mute">Інтереси</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={`rounded-full px-3 py-2 text-sm ${
                  interests.includes(item.id) ? "bg-clay text-white" : "bg-card border border-line"
                }`}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <button disabled={pending} className="mt-auto rounded-2xl bg-ink py-4 font-semibold text-white disabled:opacity-60">
          {pending ? "Входимо…" : "Далі"}
        </button>
      </form>
    </main>
  );
}
