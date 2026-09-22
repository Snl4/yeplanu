import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { kmDistance } from "../src/lib/geo";
import { makeAvatar } from "../src/lib/avatar";
import type { Complaint, Database, DirectMessage, Gathering, Invite, User } from "./types";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

function empty(): Database {
  return { users: [], gatherings: [], invites: [], interests: [], ratings: [], complaints: [], dms: [] };
}

function normalizeUser(user: User): User {
  return {
    ...user,
    phoneVerified: user.phoneVerified ?? false,
    district: user.district ?? "",
    age: user.age ?? 0,
    phone: user.phone ?? "",
    rating: user.rating ?? 0,
    ratingsCount: user.ratingsCount ?? 0,
    looking: user.looking ?? false,
    freeAfter: user.freeAfter ?? "",
    interests: user.interests ?? [],
  };
}

function seed(db: Database): Database {
  if (db.seeded) return db;
  const demo = [
    {
      name: "Влад",
      age: 21,
      district: "Оболонь",
      interests: ["beer", "games", "music"],
      freeAfter: "19:00",
      lat: 50.5012,
      lng: 30.4981,
    },
    {
      name: "Марія",
      age: 24,
      district: "Поділ",
      interests: ["talk", "cinema", "walk"],
      freeAfter: "18:30",
      lat: 50.4687,
      lng: 30.5168,
    },
    {
      name: "Андрій",
      age: 26,
      district: "Центр",
      interests: ["games", "beer", "sport"],
      freeAfter: "",
      lat: 50.4473,
      lng: 30.5225,
    },
    {
      name: "Оля",
      age: 23,
      district: "Лівобережна",
      interests: ["cinema", "music", "walk", "custom:скейт"],
      freeAfter: "20:00",
      lat: 50.4518,
      lng: 30.5984,
    },
  ];
  for (const item of demo) {
    if (db.users.some((user) => user.name === item.name && user.district === item.district)) continue;
    db.users.push({
      id: randomUUID(),
      token: randomUUID(),
      name: item.name,
      avatar: makeAvatar(item.name),
      verified: true,
      phoneVerified: true,
      interests: item.interests,
      city: "Київ",
      district: item.district,
      age: item.age,
      phone: "",
      rating: 4.7,
      ratingsCount: 6,
      looking: true,
      freeAfter: item.freeAfter,
      lat: item.lat,
      lng: item.lng,
    });
  }
  const vlad = db.users.find((user) => user.name === "Влад");
  if (vlad && !db.gatherings.some((item) => item.title.includes("Пиво"))) {
    db.gatherings.unshift({
      id: randomUUID(),
      hostId: vlad.id,
      mode: "plan",
      activity: "beer",
      title: "Пиво сьогодні",
      note: "Хто поруч — після 20:00",
      lat: 50.5012,
      lng: 30.4981,
      placeLabel: "Оболонь, Київ",
      when: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(),
      expiresAt: new Date(new Date().setHours(23, 30, 0, 0)).toISOString(),
      spots: 5,
      participantIds: [vlad.id],
      messages: [],
    });
  }
  const maria = db.users.find((user) => user.name === "Марія");
  if (vlad && maria && !db.ratings.some((item) => item.toId === vlad.id)) {
    db.ratings.push({
      fromId: maria.id,
      toId: vlad.id,
      gatheringId: db.gatherings[0]?.id,
      score: 5,
      text: "Прийшов вчасно, без фейку. Можна кликати ще.",
      at: new Date().toISOString(),
    });
    vlad.rating = 5;
    vlad.ratingsCount = 1;
  }
  db.seeded = true;
  if (!db.invites) db.invites = [];
  if (!db.interests) db.interests = [];
  if (!db.ratings) db.ratings = [];
  if (!db.complaints) db.complaints = [];
  if (!db.dms) db.dms = [];
  return db;
}

function read(): Database {
  const raw = existsSync(dbPath) ? (JSON.parse(readFileSync(dbPath, "utf8")) as Database) : empty();
  raw.users = (raw.users ?? []).map(normalizeUser);
  raw.gatherings = (raw.gatherings ?? []).map((item) => ({
    ...item,
    spots: Math.max(item.spots || 5, item.participantIds?.length || 1, 2),
    expiresAt: item.expiresAt || defaultExpires(item.when),
  }));
  raw.invites = raw.invites ?? [];
  raw.interests = raw.interests ?? [];
  raw.ratings = (raw.ratings ?? []).map((item) => ({
    ...item,
    text: item.text ?? "",
    at: item.at ?? new Date().toISOString(),
  }));
  raw.complaints = raw.complaints ?? [];
  raw.dms = raw.dms ?? [];
  if (!raw.seeded) {
    const next = seed(raw);
    write(next);
    return next;
  }
  return raw;
}

function write(db: Database) {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function createUser(input: {
  name: string;
  avatar: string;
  interests: string[];
  city: string;
  age: number;
  phone: string;
  district: string;
}) {
  const db = read();
  const user: User = {
    id: randomUUID(),
    token: randomUUID(),
    name: input.name.trim(),
    avatar: input.avatar,
    verified: false,
    phoneVerified: false,
    interests: input.interests,
    city: input.city,
    district: input.district,
    age: input.age,
    phone: input.phone,
    rating: 0,
    ratingsCount: 0,
    looking: false,
    freeAfter: "",
  };
  db.users.push(user);
  write(db);
  return user;
}

export function userByToken(token?: string | null) {
  if (!token) return null;
  return read().users.find((user) => user.token === token) ?? null;
}

function samePhone(left?: string, right?: string) {
  return Boolean(left && right && left.replace(/\s+/g, "") === right.replace(/\s+/g, ""));
}

export function loginUser(name: string, phone?: string) {
  const db = read();
  const needle = name.trim().toLowerCase();
  const matches = db.users.filter((user) => user.name.trim().toLowerCase() === needle);
  if (!matches.length) return null;
  return matches.find((user) => samePhone(user.phone, phone)) ?? matches[0];
}

export function nameTaken(name: string) {
  const needle = name.trim().toLowerCase();
  return read().users.some((user) => user.name.trim().toLowerCase() === needle);
}

export function verifyUser(token: string, input: { avatar?: string; phone?: string }) {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  if (!user) return null;
  user.verified = true;
  user.phoneVerified = true;
  if (input.avatar) user.avatar = input.avatar;
  if (input.phone) user.phone = input.phone;
  write(db);
  return user;
}

export function setStatus(
  token: string,
  input: { looking: boolean; freeAfter?: string; lat?: number; lng?: number; district?: string },
) {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  if (!user) return null;
  user.looking = input.looking;
  if (input.freeAfter !== undefined) user.freeAfter = input.freeAfter;
  if (input.lat !== undefined) user.lat = input.lat;
  if (input.lng !== undefined) user.lng = input.lng;
  if (input.district) user.district = input.district;
  write(db);
  return user;
}

export function listPeople(viewer: User | null, origin: { lat: number; lng: number }, radiusKm: number) {
  const db = read();
  return db.users
    .filter((user) => user.looking && user.id !== viewer?.id && user.lat && user.lng)
    .map((user) => {
      const km = kmDistance(origin, { lat: user.lat!, lng: user.lng! });
      return {
        ...publicUser(user),
        km: Math.round(km * 10) / 10,
        invited: Boolean(viewer && db.invites.some((item) => item.fromId === viewer.id && item.toId === user.id && item.status === "pending")),
        interested: Boolean(viewer && db.interests.some((item) => item.fromId === viewer.id && item.toId === user.id)),
      };
    })
    .filter((user) => (user.km ?? 99) <= radiusKm)
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
}

function defaultExpires(when?: string) {
  const start = when ? Date.parse(when) : Number.NaN;
  const base = Number.isNaN(start) ? Date.now() : start;
  return new Date(base + 6 * 3600_000).toISOString();
}

function isExpired(gathering: Gathering) {
  return Boolean(gathering.expiresAt && Date.parse(gathering.expiresAt) <= Date.now());
}

function visibleTo(gathering: Gathering, viewerId?: string | null) {
  if (viewerId && gathering.participantIds.includes(viewerId)) return true;
  if (gathering.participantIds.length >= gathering.spots) return false;
  if (isExpired(gathering)) return false;
  return true;
}

export function listGatherings(viewerId?: string | null) {
  const db = read();
  return db.gatherings
    .filter((gathering) => visibleTo(gathering, viewerId))
    .map((gathering) => hydrateGathering(db, gathering));
}

export function getGathering(id: string, viewerId?: string | null) {
  const db = read();
  const gathering = db.gatherings.find((item) => item.id === id);
  if (!gathering || !visibleTo(gathering, viewerId)) return null;
  return hydrateGathering(db, gathering);
}

export function createGathering(
  host: User,
  input: Omit<Gathering, "id" | "hostId" | "participantIds" | "messages">,
) {
  const db = read();
  const gathering: Gathering = {
    ...input,
    id: randomUUID(),
    hostId: host.id,
    participantIds: [host.id],
    messages: [],
  };
  db.gatherings.unshift(gathering);
  write(db);
  return getGathering(gathering.id);
}

export function closeGathering(token: string, id: string) {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  if (!user) return null;
  const before = db.gatherings.length;
  db.gatherings = db.gatherings.filter((item) => !(item.id === id && item.hostId === user.id));
  if (db.gatherings.length === before) return null;
  write(db);
  return true;
}

export function joinGathering(token: string, id: string) {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  const gathering = db.gatherings.find((item) => item.id === id);
  if (!user || !gathering) return { error: "Немає такого збору" };
  if (gathering.participantIds.includes(user.id)) {
    return { gathering: getGathering(id, user.id) };
  }
  if (isExpired(gathering)) return { error: "Оголошення вже неактивне" };
  if (gathering.participantIds.length >= gathering.spots) {
    return { error: "Компанія вже зібралась" };
  }
  gathering.participantIds.push(user.id);
  write(db);
  return { gathering: getGathering(id, user.id) };
}

export function addMessage(token: string, id: string, text: string) {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  const gathering = db.gatherings.find((item) => item.id === id);
  if (!user || !gathering || !gathering.participantIds.includes(user.id)) return null;
  gathering.messages.push({
    id: randomUUID(),
    userId: user.id,
    text: text.trim(),
    at: new Date().toISOString(),
  });
  write(db);
  return getGathering(id, user.id);
}

export function inviteUser(token: string, toId: string) {
  const db = read();
  const from = db.users.find((item) => item.token === token);
  const to = db.users.find((item) => item.id === toId);
  if (!from || !to) return null;
  const existing = db.invites.find((item) => item.fromId === from.id && item.toId === to.id && item.status === "pending");
  if (existing) return existing;
  const invite: Invite = { id: randomUUID(), fromId: from.id, toId: to.id, status: "pending" };
  db.invites.push(invite);
  write(db);
  return invite;
}

export function markInterest(token: string, toId: string) {
  const db = read();
  const from = db.users.find((item) => item.token === token);
  if (!from) return null;
  if (!db.interests.some((item) => item.fromId === from.id && item.toId === toId)) {
    db.interests.push({ fromId: from.id, toId });
    write(db);
  }
  return { ok: true };
}

export function answerInvite(token: string, id: string, status: "accepted" | "declined") {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  const invite = db.invites.find((item) => item.id === id && item.toId === user?.id);
  if (!user || !invite) return null;
  invite.status = status;
  write(db);
  return invite;
}

export function listInvites(token: string) {
  const db = read();
  const user = db.users.find((item) => item.token === token);
  if (!user) return [];
  return db.invites
    .filter((item) => item.toId === user.id && item.status === "pending")
    .map((item) => ({ ...item, from: publicUser(db.users.find((person) => person.id === item.fromId)) }));
}

export function rateUser(token: string, toId: string, score: number, text = "", gatheringId = "") {
  const db = read();
  const from = db.users.find((item) => item.token === token);
  const to = db.users.find((item) => item.id === toId);
  if (!from || !to || from.id === to.id) return null;
  const existing = db.ratings.find((item) => item.fromId === from.id && item.toId === to.id);
  if (existing) {
    existing.score = Math.min(5, Math.max(1, score));
    existing.text = text.trim();
    existing.at = new Date().toISOString();
    if (gatheringId) existing.gatheringId = gatheringId;
  } else {
    db.ratings.push({
      fromId: from.id,
      toId,
      gatheringId,
      score: Math.min(5, Math.max(1, score)),
      text: text.trim(),
      at: new Date().toISOString(),
    });
  }
  const scores = db.ratings.filter((item) => item.toId === to.id).map((item) => item.score);
  to.ratingsCount = scores.length;
  to.rating = Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10;
  write(db);
  return publicProfile(to.id);
}

export function publicProfile(id: string) {
  const db = read();
  const user = db.users.find((item) => item.id === id);
  if (!user) return null;
  return {
    ...publicUser(user),
    reviews: db.ratings
      .filter((item) => item.toId === id)
      .map((item) => ({
        ...item,
        from: publicUser(db.users.find((person) => person.id === item.fromId)),
      })),
  };
}

export function reportUser(token: string, toId: string, reason: string) {
  const db = read();
  const from = db.users.find((item) => item.token === token);
  if (!from) return { error: "Увійди ще раз" };
  if (from.id === toId) return { error: "Себе скаржити немає сенсу" };
  if (!reason.trim()) return { error: "Напиши, що сталось" };
  const complaint: Complaint = {
    id: randomUUID(),
    fromId: from.id,
    toId,
    reason: reason.trim(),
    at: new Date().toISOString(),
  };
  db.complaints.push(complaint);
  write(db);
  return { ok: true };
}

export function listDms(token: string, otherId: string) {
  const db = read();
  const me = db.users.find((item) => item.token === token);
  if (!me) return [];
  return db.dms
    .filter((item) =>
      (item.fromId === me.id && item.toId === otherId) ||
      (item.fromId === otherId && item.toId === me.id),
    )
    .map((item) => ({
      ...item,
      from: publicUser(db.users.find((user) => user.id === item.fromId)),
    }));
}

export function sendDm(token: string, toId: string, text: string) {
  const db = read();
  const from = db.users.find((item) => item.token === token);
  const to = db.users.find((item) => item.id === toId);
  if (!from || !to) return { error: "Немає такого профілю" };
  if (from.id === to.id) return { error: "Це ти сам" };
  if (!text.trim()) return { error: "Порожньо" };
  const message: DirectMessage = {
    id: randomUUID(),
    fromId: from.id,
    toId,
    text: text.trim(),
    at: new Date().toISOString(),
  };
  db.dms.push(message);
  write(db);
  return listDms(token, toId);
}

function hydrateGathering(db: Database, gathering: Gathering) {
  return {
    ...gathering,
    host: publicUser(db.users.find((user) => user.id === gathering.hostId)),
    participants: gathering.participantIds
      .map((id) => publicUser(db.users.find((user) => user.id === id)))
      .filter(Boolean),
    messages: gathering.messages.map((message) => ({
      ...message,
      author: publicUser(db.users.find((user) => user.id === message.userId)),
    })),
  };
}

function publicUser(user?: User) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    verified: user.verified,
    phoneVerified: user.phoneVerified,
    city: user.city,
    district: user.district,
    age: user.age,
    interests: user.interests,
    rating: user.rating,
    ratingsCount: user.ratingsCount,
    looking: user.looking,
    freeAfter: user.freeAfter,
    lat: user.lat,
    lng: user.lng,
  };
}
