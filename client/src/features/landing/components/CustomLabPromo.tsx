import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BUILD_STEPS = [
  { step: "01", label: "Choose Your Case", desc: "ATX, mATX, ITX or SFF" },
  { step: "02", label: "Pick CPU + Motherboard", desc: "Intel or AMD — auto-compatible" },
  { step: "03", label: "Select GPU, RAM & Storage", desc: "Validated for your build" },
  { step: "04", label: "Add Cooling & PSU", desc: "Wattage calculated automatically" },
  { step: "05", label: "Order & We Build It", desc: "Assembled and tested by experts" },
];

export default function CustomLabPromo() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-base py-24">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(0,255,255,0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-16 px-4 md:px-8 lg:grid-cols-2">
        {/* Left: Text */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand">
            Pecify PC Builder
          </p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-tight tracking-tight text-white md:text-6xl">
            Configure Your
            <br />
            <span className="text-brand">Perfect Build</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-secondary">
            Our intelligent PC builder validates compatibility in real-time — socket
            matching, RAM generation, PSU wattage and more. Zero guess work,
            maximum performance.
          </p>

          <Link
            href="/custom-lab"
            className="group mt-10 inline-flex items-center gap-3 border border-brand/40 bg-brand/6 px-8 py-4 text-sm font-black uppercase tracking-[0.25em] text-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand hover:text-black hover:shadow-[0_0_40px_rgba(0,255,255,0.35)]"
          >
            Open PC Builder
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Right: Build steps */}
        <div className="flex flex-col gap-4">
          {BUILD_STEPS.map(({ step, label, desc }) => (
            <div
              key={step}
              className="group flex items-start gap-5 border border-white/5 bg-elevated p-5 transition-all duration-200 hover:border-brand/15"
            >
              <span className="flex-none text-2xl font-black text-brand/20 transition-colors duration-200 group-hover:text-brand/50">
                {step}
              </span>
              <div>
                <p className="text-sm font-bold text-white transition-colors duration-200 group-hover:text-brand">
                  {label}
                </p>
                <p className="mt-0.5 text-[12px] text-subtle">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
