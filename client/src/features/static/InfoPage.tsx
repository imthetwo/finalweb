import Link from "next/link";

type Section = { heading: string; body: string };

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
        {intro && <p className="mt-5 text-base leading-relaxed text-muted">{intro}</p>}

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-black uppercase tracking-wide text-fg">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </section>
          ))}
        </div>

        <Link href="/" className="mt-12 inline-block text-[12px] font-bold uppercase tracking-wider text-brand hover:underline">
          ← Back to store
        </Link>
      </div>
    </main>
  );
}
