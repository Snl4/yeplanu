import { Link } from "react-router-dom";
import { whenLabel } from "../lib/geo";
import { interestMeta, type Gathering } from "../types";
import { Avatar } from "./Avatar";

export function GatheringCard({ gathering }: { gathering: Gathering }) {
  const taken = gathering.participantIds.length;
  const meta = interestMeta(gathering.activity);
  return (
    <Link
      to={`/g/${gathering.id}`}
      className="block rounded-3xl border border-line bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar src={gathering.host?.avatar} name={gathering.host?.name ?? "Гість"} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base">
            {meta.emoji} {gathering.title}
          </h3>
          <p className="truncate text-sm text-mute">
            {gathering.placeLabel} • {whenLabel(gathering.when, gathering.mode)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-mute">Нас уже {taken}/{gathering.spots}</span>
        <span className="font-semibold text-clay">Приєднатися</span>
      </div>
    </Link>
  );
}
