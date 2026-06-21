import Link from "next/link";

type Section = { heading: string; body: string };

/** Reusable layout for simple static/info pages (support, warranty, terms…). */
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
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#00ffff]">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-base leading-relaxed text-zinc-400">{intro}</p>}

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-black uppercase tracking-wide text-white">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </section>
          ))}
        </div>

        <Link href="/" className="mt-12 inline-block text-[12px] font-bold uppercase tracking-wider text-[#00ffff] hover:underline">
          ← Back to store
        </Link>
      </div>
    </main>
  );
}
