type Props = {
  className?: string;
  mark?: boolean;
};

export function Brand({ className = "", mark = true }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 font-display tracking-tight ${className}`}>
      {mark ? <span className="brand-mark" aria-hidden>?</span> : null}
      ШО ПО ПЛАНАМ?
    </span>
  );
}
