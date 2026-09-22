import { useEffect, type ReactNode } from "react";
import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { Create } from "./pages/Create";
import { Detail } from "./pages/Detail";
import { Feed } from "./pages/Feed";
import { Login } from "./pages/Login";
import { MapPage } from "./pages/MapPage";
import { Profile } from "./pages/Profile";
import { Verify } from "./pages/Verify";
import { useApp } from "./store";

function Gate({ children }: { children: ReactNode }) {
  const { ready, user } = useApp();
  if (!ready) return <p className="px-5 pt-16 text-mute">Завантажуємо…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  return (
    <div className="app-shell">
      <header className="hidden border-b border-line bg-card/80 px-6 py-4 backdrop-blur md:flex md:items-center md:justify-between">
        <p className="font-display text-xl">Пішли</p>
        <nav className="flex gap-5 text-sm font-semibold">
          <Link to="/">Стрічка</Link>
          <Link to="/map">Карта</Link>
          <Link to="/create">Збір</Link>
          <Link to="/profile">Профіль</Link>
        </nav>
      </header>
      <Outlet />
      <BottomNav />
    </div>
  );
}

export function App() {
  const hydrate = useApp((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Gate>
            <Shell />
          </Gate>
        }
      >
        <Route path="/" element={<Feed />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/create" element={<Create />} />
        <Route path="/g/:id" element={<Detail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verify" element={<Verify />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
