import { interestMeta, type Gathering, type Person } from "../types";
import { Avatar } from "./Avatar";
import { GatheringCard } from "./GatheringCard";

type Props = {
  person: Person;
  gatherings?: Gathering[];
  onInvite?: () => void;
  onInterest?: () => void;
};

export function PersonOffer({ person, gatherings = [], onInvite, onInterest }: Props) {
  const place = [person.city || "Київ", person.district].filter(Boolean).join(", ");

  return (
    <article className="rounded-3xl border border-line bg-card p-4 md:p-5">
      <div className="flex gap-3">
        <Avatar src={person.avatar} name={person.name} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-mute">
            {person.verified ? "перевірений" : "без перевірки"}
            {person.rating ? ` · ★ ${person.rating}` : ""}
          </p>
          <h3 className="font-display text-2xl">
            {person.name}{person.age ? `, ${person.age}` : ""}
          </h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl bg-paper px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-mute">Куди</p>
          <p className="mt-1 font-semibold">📍 {place}</p>
          <p className="text-sm text-mute">
            {person.km !== undefined ? `${person.km} км від тебе · ` : ""}
            на карті зона, не точний під’їзд
          </p>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-mute">Що</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {person.interests.length ? (
              person.interests.map((id) => {
                const item = interestMeta(id);
                return (
                  <span key={id} className="rounded-full bg-clay-soft px-3 py-1 text-sm text-clay">
                    {item.emoji} {item.label}
                  </span>
                );
              })
            ) : (
              <p className="text-sm text-mute">Ще не вказав, чим хоче зайнятись.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-paper px-3 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-mute">Коли</p>
          <p className="mt-1 font-semibold">
            {person.freeAfter ? `Вільний сьогодні після ${person.freeAfter}` : "Готовий зустрітись зараз"}
          </p>
        </div>
      </div>

      {gatherings.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-mute">Його збір</p>
          {gatherings.map((item) => <GatheringCard key={item.id} gathering={item} />)}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onInvite}
          disabled={person.invited}
          className="rounded-2xl bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {person.invited ? "Запрошення надіслано" : "Запросити"}
        </button>
        <button
          onClick={onInterest}
          disabled={person.interested}
          className="rounded-2xl border border-line py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {person.interested ? "Вже цікаво" : "Цікаво"}
        </button>
      </div>
    </article>
  );
}
