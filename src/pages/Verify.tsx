import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthScene } from "../components/AuthScene";
import { Brand } from "../components/Brand";
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
    <main className="auth-page">
      <AuthScene
        kicker="Останній крок"
        title={"Телефон і фото —\nі можна кликати"}
        subtitle="У тесті код завжди 1234. Далі тут буде SMS і перевірка селфі."
      />
      <section className="auth-panel">
        <div className="auth-panel-inner auth-form-body">
          <Brand className="text-lg md:text-xl" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-clay">Верифікація</p>
          <h1 className="mt-2 font-display text-3xl">Підтверди себе</h1>
          <label className="verify-photo">
            {preview ? <img src={preview} alt="" /> : <span>Додай селфі</span>}
            <input type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
          </label>
          <label className="auth-field">
            Телефон
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+380..." />
          </label>
          {sent ? (
            <label className="auth-field">
              Код з SMS
              <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="1234" />
            </label>
          ) : (
            <button type="button" onClick={() => setSent(true)} className="rounded-2xl border border-line py-3 transition hover:-translate-y-0.5">
              Надіслати код
            </button>
          )}
          {error ? <p className="text-sm text-clay">{error}</p> : null}
          <button onClick={() => void submit()} disabled={pending || !sent} className="auth-submit">
            {pending ? "Перевіряємо…" : "Підтвердити"}
          </button>
        </div>
      </section>
    </main>
  );
}
