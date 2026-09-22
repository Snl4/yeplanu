import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { fileToDataUrl } from "../lib/avatar";
import { useApp } from "../store";

export function Verify() {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  const [preview, setPreview] = useState(user?.avatar ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    setPreview(await fileToDataUrl(file));
  }

  async function submit() {
    setPending(true);
    setError("");
    try {
      const next = await api.verify({ avatar: preview, phone, code });
      setUser(next);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося перевірити");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8 pt-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Верифікація</p>
      <h1 className="mt-3 font-display text-3xl">Телефон і фото</h1>
      <p className="mt-3 text-mute">
        Телефон + селфі. У тесті код завжди 1234. Далі тут буде SMS і перевірка фото.
      </p>
      <label className="mx-auto mt-8 block h-52 w-40 overflow-hidden rounded-[32px] border border-line bg-card">
        {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
        <input type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
      <label className="mt-6 grid gap-2 text-xs font-bold uppercase tracking-wide text-mute">
        Телефон
        <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border border-line bg-card px-4 py-3 text-base" placeholder="+380..." />
      </label>
      {sent ? (
        <label className="mt-3 grid gap-2 text-xs font-bold uppercase tracking-wide text-mute">
          Код з SMS
          <input value={code} onChange={(event) => setCode(event.target.value)} className="rounded-2xl border border-line bg-card px-4 py-3 text-base" placeholder="1234" />
        </label>
      ) : (
        <button type="button" onClick={() => setSent(true)} className="mt-3 rounded-2xl border border-line py-3">
          Надіслати код
        </button>
      )}
      {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
      <button onClick={submit} disabled={pending || !sent} className="mt-auto rounded-2xl bg-clay py-4 font-semibold text-white disabled:opacity-60">
        {pending ? "Перевіряємо…" : "Підтвердити"}
      </button>
    </main>
  );
}
