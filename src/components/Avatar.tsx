type Props = {
  src?: string;
  name: string;
  size?: number;
};

export function Avatar({ src, name, size = 44 }: Props) {
  return (
    <img
      src={src || ""}
      alt={name}
      className="rounded-2xl object-cover bg-clay-soft"
      style={{ width: size, height: size }}
    />
  );
}
