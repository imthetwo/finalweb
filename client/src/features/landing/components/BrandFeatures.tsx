import { Gift, Truck, Headset, RotateCcw } from "lucide-react";

const FEATURES = [
  { icon: Gift,     title: "Exclusive Products\n& Bundles" },
  { icon: Truck,    title: "Ships Free Next\nBusiness Day*" },
  { icon: Headset,  title: "Live Chat With\nProduct Specialists" },
  { icon: RotateCcw, title: "60-Day Risk\nFree Returns" },
];

export default function BrandFeatures() {
  return (
    <section className="bg-black py-12">
      <div className="mx-auto max-w-375 px-4 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="group flex h-48 flex-col justify-between border border-white/10 bg-[#0d0d0d] p-7 transition-all duration-300 hover:border-[#00ffff]/30 hover:bg-[#111]"
            >
              <Icon
                size={34}
                strokeWidth={1.5}
                className="text-white transition-colors duration-300 group-hover:text-[#00ffff]"
              />
              <p className="whitespace-pre-line text-lg font-black uppercase leading-tight tracking-tight text-white">
                {title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
