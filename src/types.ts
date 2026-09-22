export type PublicUser = {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  phoneVerified: boolean;
  city: string;
  district: string;
  age: number;
  interests: string[];
  rating: number;
  ratingsCount: number;
  looking: boolean;
  freeAfter: string;
  lat?: number;
  lng?: number;
};

export type User = PublicUser & {
  token: string;
  phone: string;
};

export type Person = PublicUser & {
  km?: number;
  invited?: boolean;
  interested?: boolean;
};

export type Message = {
  id: string;
  userId: string;
  text: string;
  at: string;
  author: PublicUser | null;
};

export type Gathering = {
  id: string;
  hostId: string;
  mode: "now" | "plan";
  activity: string;
  title: string;
  note: string;
  lat: number;
  lng: number;
  placeLabel: string;
  when: string;
  spots: number;
  participantIds: string[];
  host: PublicUser | null;
  participants: PublicUser[];
  messages: Message[];
};

export type Invite = {
  id: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "declined";
  from: PublicUser | null;
};

export const INTERESTS = [
  { id: "beer", label: "Пиво", emoji: "🍺" },
  { id: "games", label: "Ігри", emoji: "🎮" },
  { id: "cinema", label: "Кіно", emoji: "🎬" },
  { id: "walk", label: "Прогулянка", emoji: "🚶" },
  { id: "bbq", label: "Шашлики", emoji: "🏕️" },
  { id: "talk", label: "Посидіти", emoji: "☕" },
  { id: "sport", label: "Спорт", emoji: "🏃" },
  { id: "music", label: "Музика", emoji: "🎵" },
  { id: "cars", label: "Авто", emoji: "🚗" },
] as const;

export const RADII = [1, 5, 10, 30] as const;

export function customInterestId(label: string) {
  return `custom:${label.trim().slice(0, 32)}`;
}

export function isCustomInterest(id: string) {
  return id.startsWith("custom:");
}

export function interestMeta(id: string) {
  const known = INTERESTS.find((item) => item.id === id);
  if (known) return known;
  if (isCustomInterest(id)) {
    return { id, label: id.slice(7) || "Свій варіант", emoji: "✨" };
  }
  return { id, label: id, emoji: "✨" };
}
