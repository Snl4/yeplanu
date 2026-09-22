import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { inRegion, KYIV } from "../src/lib/geo";
import {
  addMessage,
  answerInvite,
  closeGathering,
  createGathering,
  createUser,
  getGathering,
  inviteUser,
  joinGathering,
  listGatherings,
  listInvites,
  listPeople,
  markInterest,
  rateUser,
  setStatus,
  userByToken,
  verifyUser,
} from "./store";

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function tokenFrom(req: IncomingMessage) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function apiPlugin(): Plugin {
  return {
    name: "pishly-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api")) return next();

        try {
          const method = req.method ?? "GET";
          const path = url.pathname;
          const token = tokenFrom(req);
          const me = userByToken(token);

          if (method === "POST" && path === "/api/session") {
            const body = JSON.parse((await readBody(req)) || "{}");
            if (!body.name?.trim()) return json(res, 400, { error: "Потрібне ім’я" });
            const user = createUser({
              name: body.name,
              avatar: body.avatar || "",
              interests: body.interests ?? [],
              city: body.city || "Київ",
              age: Number(body.age) || 0,
              phone: body.phone || "",
              district: body.district || "",
            });
            return json(res, 200, user);
          }

          if (method === "GET" && path === "/api/me") {
            return me ? json(res, 200, me) : json(res, 401, { error: "Увійди ще раз" });
          }

          if (method === "POST" && path === "/api/verify") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            const body = JSON.parse((await readBody(req)) || "{}");
            if (body.code && body.code !== "1234") {
              return json(res, 400, { error: "Невірний код. Для тесту: 1234" });
            }
            return json(res, 200, verifyUser(token!, { avatar: body.avatar, phone: body.phone }));
          }

          if (method === "POST" && path === "/api/status") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            const body = JSON.parse((await readBody(req)) || "{}");
            if (body.lat && body.lng && !inRegion(Number(body.lat), Number(body.lng))) {
              return json(res, 400, { error: "Поки лише Київ і область" });
            }
            return json(res, 200, setStatus(token!, body));
          }

          if (method === "GET" && path === "/api/people") {
            const lat = Number(url.searchParams.get("lat") || KYIV.lat);
            const lng = Number(url.searchParams.get("lng") || KYIV.lng);
            const radius = Number(url.searchParams.get("radius") || 10);
            return json(res, 200, listPeople(me, { lat, lng }, radius));
          }

          if (method === "POST" && path === "/api/invite") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            const body = JSON.parse((await readBody(req)) || "{}");
            const invite = inviteUser(token!, body.toId);
            return invite ? json(res, 200, invite) : json(res, 404, { error: "Немає такого користувача" });
          }

          if (method === "GET" && path === "/api/invites") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            return json(res, 200, listInvites(token!));
          }

          if (method === "POST" && path.startsWith("/api/invites/")) {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            const id = path.split("/")[3];
            const body = JSON.parse((await readBody(req)) || "{}");
            const invite = answerInvite(token!, id, body.status === "accepted" ? "accepted" : "declined");
            return invite ? json(res, 200, invite) : json(res, 404, { error: "Немає запрошення" });
          }

          if (method === "POST" && path === "/api/interest") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            const body = JSON.parse((await readBody(req)) || "{}");
            return json(res, 200, markInterest(token!, body.toId));
          }

          if (method === "POST" && path === "/api/rate") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            const body = JSON.parse((await readBody(req)) || "{}");
            const rated = rateUser(token!, body.toId, body.gatheringId, Number(body.score));
            return rated ? json(res, 200, rated) : json(res, 400, { error: "Оцінити можна після спільного збору" });
          }

          if (method === "GET" && path === "/api/gatherings") {
            return json(res, 200, listGatherings().filter((item) => inRegion(item.lat, item.lng)));
          }

          if (method === "POST" && path === "/api/gatherings") {
            if (!me) return json(res, 401, { error: "Увійди ще раз" });
            if (!me.verified) return json(res, 403, { error: "Спочатку пройди перевірку" });
            const body = JSON.parse((await readBody(req)) || "{}");
            if (!body.lat || !body.lng || !body.title) {
              return json(res, 400, { error: "Немає місця або назви" });
            }
            if (!inRegion(Number(body.lat), Number(body.lng))) {
              return json(res, 400, { error: "Поки лише Київ і Київська область" });
            }
            const placeLabel = body.placeLabel || (await reverseGeocode(body.lat, body.lng));
            const gathering = createGathering(me, {
              mode: body.mode === "plan" ? "plan" : "now",
              activity: body.activity || "talk",
              title: body.title,
              note: body.note || "",
              lat: Number(body.lat),
              lng: Number(body.lng),
              placeLabel,
              when: body.when || new Date().toISOString(),
              spots: Math.max(2, Number(body.spots) || 5),
            });
            return json(res, 200, gathering);
          }

          const gatheringMatch = path.match(/^\/api\/gatherings\/([^/]+)(\/[^/]+)?$/);
          if (gatheringMatch) {
            const id = gatheringMatch[1];
            const action = gatheringMatch[2];

            if (method === "GET" && !action) {
              const gathering = getGathering(id);
              if (!gathering || !inRegion(gathering.lat, gathering.lng)) {
                return json(res, 404, { error: "Немає такого збору" });
              }
              return json(res, 200, gathering);
            }

            if (method === "DELETE" && !action) {
              const ok = closeGathering(token ?? "", id);
              return ok ? json(res, 200, { ok: true }) : json(res, 404, { error: "Не вдалося закрити" });
            }

            if (method === "POST" && action === "/join") {
              const gathering = joinGathering(token ?? "", id);
              return gathering ? json(res, 200, gathering) : json(res, 404, { error: "Не вдалося приєднатись" });
            }

            if (method === "POST" && action === "/messages") {
              const body = JSON.parse((await readBody(req)) || "{}");
              const gathering = addMessage(token ?? "", id, body.text ?? "");
              return gathering ? json(res, 200, gathering) : json(res, 400, { error: "Не вдалося надіслати" });
            }
          }

          if (method === "GET" && path === "/api/geocode") {
            const lat = Number(url.searchParams.get("lat"));
            const lng = Number(url.searchParams.get("lng"));
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return json(res, 400, { error: "Погані координати" });
            }
            if (!inRegion(lat, lng)) {
              return json(res, 400, { error: "Поки лише Київ і Київська область" });
            }
            return json(res, 200, { label: await reverseGeocode(lat, lng) });
          }

          return json(res, 404, { error: "Немає такого маршруту" });
        } catch (error) {
          console.error(error);
          return json(res, 500, { error: "Серверна помилка" });
        }
      });
    },
  };
}

async function reverseGeocode(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=uk`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Pishly/0.1 (local concept)" },
  });
  if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const data = (await response.json()) as {
    address?: {
      suburb?: string;
      neighbourhood?: string;
      city_district?: string;
      road?: string;
      city?: string;
      town?: string;
      village?: string;
    };
    display_name?: string;
  };
  const address = data.address ?? {};
  const area = address.suburb || address.neighbourhood || address.city_district || address.road;
  const city = address.city || address.town || address.village;
  if (area && city) return `${area}, ${city}`;
  if (city) return city;
  return data.display_name?.split(",").slice(0, 2).join(",") || "Невідоме місце";
}
