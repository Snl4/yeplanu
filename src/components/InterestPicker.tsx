import { useState } from "react";
import { customInterestId, interestMeta, INTERESTS, isCustomInterest } from "../types";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  extras?: string[];
};

export function InterestPicker({ value, onChange, multiple = true, extras = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const customs = [...new Set([
    ...value.filter(isCustomInterest),
    ...extras.filter((id) => isCustomInterest(id) && !value.includes(id)),
  ])];

  function select(id: string) {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
      return;
    }
    onChange(value.includes(id) ? [] : [id]);
  }

  function addCustom() {
    const id = customInterestId(draft);
    if (id === "custom:") return;
    select(id);
    setDraft("");
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {INTERESTS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => select(item.id)}
          className={`interest-chip ${value.includes(item.id) ? "is-on" : ""}`}
        >
          {item.emoji} {item.label}
        </button>
      ))}
      {customs.map((id) => {
        const item = interestMeta(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => select(id)}
            className={`interest-chip ${value.includes(id) ? "is-on" : ""}`}
          >
            {item.emoji} {item.label}
          </button>
        );
      })}
      {open ? (
        <span className="flex items-center gap-1 rounded-full border border-clay bg-card px-2 py-1">
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="скейт, настілки…"
            maxLength={32}
            className="w-36 bg-transparent px-1 text-sm text-ink outline-none"
          />
          <button type="button" onClick={addCustom} className="text-sm font-semibold text-clay">
            Додати
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="interest-chip">
          ✨ Свій варіант
        </button>
      )}
    </div>
  );
}
