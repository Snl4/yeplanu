import { useNavigate } from "react-router-dom";

type Props = {
  profileId?: string;
  onGo?: () => void;
  going?: boolean;
  disabled?: boolean;
};

export function JoinActions({ profileId, onGo, going, disabled }: Props) {
  const navigate = useNavigate();

  return (
    <div className="join-actions">
      <button
        type="button"
        onClick={onGo}
        disabled={going || disabled}
        className="join-go"
      >
        {going ? "Ти вирушаєш" : "Вирушаю"}
      </button>
      <button
        type="button"
        disabled={!profileId}
        onClick={() => profileId && navigate(`/u/${profileId}?write=1`)}
        className="join-side"
      >
        Написати
      </button>
      <button
        type="button"
        disabled={!profileId}
        onClick={() => profileId && navigate(`/u/${profileId}`)}
        className="join-side"
      >
        Профіль
      </button>
    </div>
  );
}
