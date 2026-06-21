import InfoPage from "@/features/static/InfoPage";

export const metadata = { title: "About | Pecify" };

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Who we are"
      title="About Pecify"
      intro="Pecify is a premium PC components and gaming gear store, built for players who demand maximum performance."
      sections={[
        { heading: "Our mission", body: "Make building the perfect PC effortless — from hand-picked components to our intelligent PC Builder that validates compatibility in real time." },
        { heading: "What we offer", body: "500+ products across CPUs, GPUs, motherboards, memory, storage, cooling, cases, peripherals and gaming furniture from the brands you trust." },
        { heading: "Why Pecify", body: "Genuine products, expert assembly, 2-year warranty, and an AI build advisor that recommends configurations from real, in-stock inventory." },
      ]}
    />
  );
}
