import { useEffect, type ReactNode } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { Avatar } from "./components/Avatar";
import { BottomNav } from "./components/BottomNav";
import { Brand } from "./components/Brand";
import { Create } from "./pages/Create";
import { Detail } from "./pages/Detail";
import { Feed } from "./pages/Feed";
import { Login } from "./pages/Login";
import { MapPage } from "./pages/MapPage";
import { Profile } from "./pages/Profile";
import { UserPage } from "./pages/UserPage";
import { Verify } from "./pages/Verify";
import { useApp } from "./store";

function Gate({ children }: { children: ReactNode }) {
  const { ready, user } = useApp();
  if (!ready) {
    return (
      <div className="boot-screen">
        <div>
          <Brand className="text-2xl" />
          <p className="mt-3 text-mute">Завантажуємо плани…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  const user = useApp((state) => state.user);
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="text-lg">
            <Brand />
          </Link>
          <nav className="site-nav">
            <NavLink to="/" end>Стрічка</NavLink>
            <NavLink to="/map">Карта</NavLink>
            <NavLink to="/create">Збір</NavLink>
            <NavLink to="/profile">Профіль</NavLink>
          </nav>
          {user ? (
            <Link to="/profile" className="header-user">
              <Avatar src={user.avatar} name={user.name} size={34} />
              <span className="text-sm font-semibold">{user.name}</span>
            </Link>
          ) : null}
        </div>
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
        path="/verify"
        element={
          <Gate>
            <Verify />
          </Gate>
        }
      />
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
        <Route path="/u/:id" element={<UserPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
