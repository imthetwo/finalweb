import { Gift, Truck, Headset, RotateCcw } from "lucide-react";

const FEATURES = [
  { icon: Gift,     title: "Exclusive Products\n& Bundles" },
  { icon: Truck,    title: "Ships Free Next\nBusiness Day*" },
  { icon: Headset,  title: "Live Chat With\nProduct Specialists" },
  { icon: RotateCcw, title: "60-Day Risk\nFree Returns" },
];

export default function BrandFeatures() {
  return (
    <section className="bg-base py-12">
      <div className="mx-auto max-w-375 px-4 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex h-48 flex-col justify-between border border-white/10 bg-surface p-7"
            >
              <Icon size={34} strokeWidth={1.5} className="text-fg" />
              <p className="whitespace-pre-line text-lg font-black uppercase leading-tight tracking-tight text-fg">
                {title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
