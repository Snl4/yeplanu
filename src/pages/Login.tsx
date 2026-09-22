import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthScene } from "../components/AuthScene";
import { Brand } from "../components/Brand";
import { api } from "../lib/api";
import { makeAvatar } from "../lib/avatar";
import { useApp } from "../store";
import { INTERESTS } from "../types";

type Mode = "login" | "register";

export function Login() {
  const navigate = useNavigate();
  const login = useApp((state) => state.login);
  const [mode, setMode] = useState<Mode>("login");
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

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const user =
        mode === "login"
          ? await api.login({ name, phone, mode: "login" })
          : await api.login({
              name,
              age: Number(age),
              phone,
              district,
              city: "Київ",
              interests,
              avatar: makeAvatar(name),
              mode: "register",
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
    <main className="auth-page">
      <AuthScene
        title={"Шо по планам\nна вечір?"}
        subtitle="Люди поруч у Києві. Пиво, ігри, кіно, прогулянка — не обов’язково один на один."
      />
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <Brand className="text-lg md:text-xl" />
          <div className="auth-tabs" data-mode={mode}>
            <span className="auth-tab-slider" />
            <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>
              Вхід
            </button>
            <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>
              Реєстрація
            </button>
          </div>
          <p className="mt-5 text-mute">
            {mode === "login"
              ? "Увійди зі своїм ім’ям. Для демо спробуй Влада, Марію, Андрія або Олю."
              : "Пара хвилин — і ти в стрічці. Локація з’явиться лише коли скажеш, що вільний."}
          </p>
          <form className="mt-6 flex flex-1 flex-col gap-4" onSubmit={onSubmit}>
            <div key={mode} className="auth-form-body">
              <label className="auth-field">
                Ім’я
                <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Влад" />
              </label>
              {mode === "register" ? (
                <div className="auth-field grid grid-cols-2 gap-3">
                  <label className="auth-field !animate-none">
                    Вік
                    <input required type="number" min={18} max={80} value={age} onChange={(event) => setAge(event.target.value)} />
                  </label>
                  <label className="auth-field !animate-none">
                    Район
                    <input required value={district} onChange={(event) => setDistrict(event.target.value)} />
                  </label>
                </div>
              ) : null}
              <label className="auth-field">
                Телефон {mode === "login" ? <span className="font-medium normal-case tracking-normal text-mute">(необов’язково)</span> : null}
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+380..." />
              </label>
              {mode === "register" ? (
                <div className="auth-field">
                  <p className="text-xs font-bold uppercase tracking-wide text-mute">Інтереси</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {INTERESTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className={`interest-chip ${interests.includes(item.id) ? "is-on" : ""}`}
                      >
                        {item.emoji} {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            {error ? <p className="text-sm text-clay">{error}</p> : null}
            <button disabled={pending} className="auth-submit">
              {pending ? "Тримай секунду…" : mode === "login" ? "Увійти" : "Створити профіль"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
