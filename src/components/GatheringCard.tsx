import { useNavigate } from "react-router-dom";
import { untilLabel, whenLabel } from "../lib/geo";
import { api } from "../lib/api";
import { useApp } from "../store";
import { interestMeta, type Gathering } from "../types";
import { Avatar } from "./Avatar";
import { JoinActions } from "./JoinActions";

export function GatheringCard({ gathering }: { gathering: Gathering }) {
  const navigate = useNavigate();
  const user = useApp((state) => state.user);
  const taken = gathering.participantIds.length;
  const meta = interestMeta(gathering.activity);
  const full = taken >= gathering.spots;
  const going = Boolean(user && gathering.participantIds.includes(user.id));

  async function go() {
    try {
      await api.join(gathering.id);
      navigate(`/g/${gathering.id}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Не вдалося вирушити");
    }
  }

  return (
    <article className="lift-card rounded-3xl border border-line bg-card p-4">
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => navigate(`/g/${gathering.id}`)}>
        <Avatar src={gathering.host?.avatar} name={gathering.host?.name ?? "Гість"} size={48} rating={gathering.host?.rating} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base">
            {meta.emoji} {gathering.title}
          </h3>
          <p className="truncate text-sm text-mute">
            {gathering.placeLabel} • {whenLabel(gathering.when, gathering.mode)}
          </p>
          <p className="text-xs text-mute">
            Активне до {untilLabel(gathering.expiresAt)} · {taken}/{gathering.spots}
          </p>
        </div>
      </button>
      <div className="mt-3">
        <JoinActions
          profileId={gathering.hostId}
          onGo={() => void go()}
          going={going}
          disabled={full && !going}
        />
      </div>
    </article>
  );
}
