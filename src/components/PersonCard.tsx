import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { interestMeta, type Gathering, type Person } from "../types";
import { Avatar } from "./Avatar";
import { JoinActions } from "./JoinActions";

type Props = {
  person: Person;
  gatherings?: Gathering[];
};

export function PersonCard({ person, gatherings = [] }: Props) {
  const navigate = useNavigate();
  const hosted = gatherings.find((item) => item.hostId === person.id);

  async function go() {
    if (hosted) {
      try {
        await api.join(hosted.id);
        navigate(`/g/${hosted.id}`);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Не вдалося вирушити");
      }
      return;
    }
    await api.invite(person.id);
    navigate(`/u/${person.id}`);
  }

  return (
    <article className="lift-card rounded-3xl border border-line bg-card p-4">
      <div className="flex gap-3">
        <Avatar src={person.avatar} name={person.name} size={56} rating={person.rating} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg">
            {person.name}{person.age ? `, ${person.age}` : ""}
          </h3>
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
      <div className="mt-4">
        <JoinActions profileId={person.id} onGo={() => void go()} going={person.invited} />
      </div>
    </article>
  );
}
