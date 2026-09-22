const cards = [
  { emoji: "🍺", title: "Пиво сьогодні", meta: "Оболонь · після 20:00", delay: "0s" },
  { emoji: "🎮", title: "CS удвох", meta: "Поділ · зараз", delay: "0.8s" },
  { emoji: "🎬", title: "Кіно на Хрещатику", meta: "3 вільні місця", delay: "1.6s" },
];

type Props = {
  kicker?: string;
  title: string;
  subtitle: string;
};

export function AuthScene({ kicker = "Київ і область", title, subtitle }: Props) {
  return (
    <aside className="auth-scene">
      <div className="auth-orb auth-orb-a" />
      <div className="auth-orb auth-orb-b" />
      <div className="auth-orb auth-orb-c" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay">{kicker}</p>
          <h2 className="auth-hero-title">
            {title.split("\n").map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </h2>
          <p className="mt-4 max-w-md text-base text-mute md:text-lg">{subtitle}</p>
        </div>
        <div className="hidden space-y-3 md:block" aria-hidden>
          {cards.map((card) => (
            <article
              key={card.title}
              className="auth-float-card"
              style={{ animationDelay: card.delay }}
            >
              <span className="text-2xl">{card.emoji}</span>
              <div>
                <p className="font-display text-base">{card.title}</p>
                <p className="text-sm text-mute">{card.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}
