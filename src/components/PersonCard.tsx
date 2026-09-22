import { interestMeta, type Person } from "../types";
import { Avatar } from "./Avatar";

type Props = {
  person: Person;
  onInvite?: () => void;
  onInterest?: () => void;
};

export function PersonCard({ person, onInvite, onInterest }: Props) {
  return (
    <article className="lift-card rounded-3xl border border-line bg-card p-4">
      <div className="flex gap-3">
        <Avatar src={person.avatar} name={person.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg">
              {person.name}{person.age ? `, ${person.age}` : ""}
            </h3>
            <span className="text-xs text-mute">
              {person.rating ? `★ ${person.rating}` : "новий"}
            </span>
          </div>
          <p className="text-sm text-mute">
            📍 {person.city || "Київ"}{person.district ? `, ${person.district}` : ""}
            {person.km !== undefined ? ` · ${person.km} км` : ""}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm">
        {person.interests.map((id) => {
          const item = interestMeta(id);
          return `${item.emoji} ${item.label}`;
        }).join(" • ")}
      </p>
      <p className="mt-2 text-sm text-mute">
        {person.freeAfter
          ? `Вільний сьогодні після ${person.freeAfter}`
          : "Готовий зустрітись зараз"}
      </p>
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
