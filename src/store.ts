import { create } from "zustand";
import { api, clearToken, getToken, setToken } from "./lib/api";
import { KYIV } from "./lib/geo";
import type { Gathering, Invite, Person, User } from "./types";

type AppState = {
  ready: boolean;
  user: User | null;
  gatherings: Gathering[];
  people: Person[];
  invites: Invite[];
  origin: { lat: number; lng: number };
  radius: number;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  setRadius: (radius: number) => void;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
};

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  user: null,
  gatherings: [],
  people: [],
  invites: [],
  origin: KYIV,
  radius: 10,
  async hydrate() {
    try {
      if (!getToken()) {
        set({ ready: true, user: null });
        return;
      }
      const user = await api.me();
      set({ user, ready: true });
      await get().refresh();
    } catch {
      clearToken();
      set({ user: null, gatherings: [], people: [], invites: [], ready: true });
    }
  },
  async refresh() {
    const { origin, radius } = get();
    const [gatherings, people, invites] = await Promise.all([
      api.gatherings(),
      api.people(origin.lat, origin.lng, radius),
      api.invites().catch(() => []),
    ]);
    set({ gatherings, people, invites });
  },
  setRadius(radius) {
    set({ radius });
    void get().refresh();
  },
  login(user) {
    setToken(user.token);
    set({ user });
  },
  logout() {
    clearToken();
    set({ user: null, gatherings: [], people: [], invites: [] });
  },
  setUser(user) {
    set({ user });
  },
}));
