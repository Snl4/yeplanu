import type { DirectMessage, Gathering, Invite, Person, ProfileView, User } from "../types";

const TOKEN_KEY = "pishly-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Помилка запиту");
  return data as T;
}

export const api = {
  me: () => request<User>("/api/me"),
  login: (body: {
    name: string;
    avatar?: string;
    interests?: string[];
    city?: string;
    age?: number;
    phone?: string;
    district?: string;
    mode?: "login" | "register";
  }) => request<User>("/api/session", { method: "POST", body: JSON.stringify(body) }),
  verify: (body: { avatar?: string; phone?: string; code?: string }) =>
    request<User>("/api/verify", { method: "POST", body: JSON.stringify(body) }),
  status: (body: { looking: boolean; freeAfter?: string; lat?: number; lng?: number; district?: string }) =>
    request<User>("/api/status", { method: "POST", body: JSON.stringify(body) }),
  people: (lat: number, lng: number, radius: number) =>
    request<Person[]>(`/api/people?lat=${lat}&lng=${lng}&radius=${radius}`),
  invite: (toId: string) => request<Invite>("/api/invite", { method: "POST", body: JSON.stringify({ toId }) }),
  invites: () => request<Invite[]>("/api/invites"),
  answerInvite: (id: string, status: "accepted" | "declined") =>
    request<Invite>(`/api/invites/${id}`, { method: "POST", body: JSON.stringify({ status }) }),
  interest: (toId: string) => request<{ ok: boolean }>("/api/interest", { method: "POST", body: JSON.stringify({ toId }) }),
  rate: (toId: string, gatheringId: string, score: number, text = "") =>
    request("/api/rate", { method: "POST", body: JSON.stringify({ toId, gatheringId, score, text }) }),
  profile: (id: string) => request<ProfileView>(`/api/users/${id}`),
  review: (toId: string, score: number, text: string) =>
    request<ProfileView>("/api/rate", { method: "POST", body: JSON.stringify({ toId, score, text }) }),
  report: (toId: string, reason: string) =>
    request<{ ok: boolean }>(`/api/users/${toId}/report`, { method: "POST", body: JSON.stringify({ reason }) }),
  dms: (userId: string) => request<DirectMessage[]>(`/api/dm/${userId}`),
  dm: (toId: string, text: string) =>
    request<DirectMessage[]>("/api/dm", { method: "POST", body: JSON.stringify({ toId, text }) }),
  gatherings: () => request<Gathering[]>("/api/gatherings"),
  gathering: (id: string) => request<Gathering>(`/api/gatherings/${id}`),
  create: (body: Partial<Gathering> & { lat: number; lng: number; title: string }) =>
    request<Gathering>("/api/gatherings", { method: "POST", body: JSON.stringify(body) }),
  join: (id: string) => request<Gathering>(`/api/gatherings/${id}/join`, { method: "POST" }),
  close: (id: string) => request<{ ok: boolean }>(`/api/gatherings/${id}`, { method: "DELETE" }),
  message: (id: string, text: string) =>
    request<Gathering>(`/api/gatherings/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  geocode: (lat: number, lng: number) =>
    request<{ label: string }>(`/api/geocode?lat=${lat}&lng=${lng}`),
};
