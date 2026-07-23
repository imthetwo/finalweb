import Link from "next/link";

// A section's body is either one paragraph, or a short list of points —
// Terms/Warranty read better as scannable points once there's more than one
// sentence per section; Privacy/About stay plain paragraphs.
type Section = { heading: string; body: string | string[] };

export default function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  sections: Section[];
}) {
  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-fg md:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary">{intro}</p>}

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-black uppercase tracking-wide text-fg">{s.heading}</h2>
              {Array.isArray(s.body) ? (
                <ul className="mt-3 space-y-2.5">
                  {s.body.map((point) => (
                    <li key={point} className="flex gap-2.5 text-base leading-relaxed text-secondary">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-brand/60" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-base leading-relaxed text-secondary">{s.body}</p>
              )}
            </section>
          ))}
        </div>

        <Link href="/" className="mt-12 inline-block text-sm font-bold uppercase tracking-wider text-brand hover:underline">
          ← Back to store
        </Link>
      </div>
    </main>
  );
}
