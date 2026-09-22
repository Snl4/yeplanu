type Props = {
  src?: string;
  name: string;
  size?: number;
  rating?: number;
};

export function Avatar({ src, name, size = 44, rating }: Props) {
  return (
    <span className="avatar-wrap" style={{ width: size, height: size }}>
      <img src={src || ""} alt={name} className="avatar-img" />
      {rating && size >= 40 ? <span className="avatar-rating">★ {rating}</span> : null}
    </span>
  );
}
