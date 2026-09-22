import { MapPinned, Plus, Sparkles, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Сьогодні", icon: Sparkles, end: true },
  { to: "/map", label: "Карта", icon: MapPinned, end: false },
  { to: "/create", label: "Збір", icon: Plus, end: false },
  { to: "/profile", label: "Профіль", icon: UserRound, end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs font-semibold ${
                  isActive ? "text-clay" : "text-mute"
                }`
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
