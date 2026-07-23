import InfoPage from "./InfoPage";

export function SupportPage() {
  return (
    <InfoPage
      eyebrow="We're here to help"
      title="Support"
      intro="Questions about an order, a build, or a product? Our team is available 24/7."
      sections={[
        { heading: "Contact", body: "Email support@pecify.tech or call +84 900 000 000. The AI assistant in the bottom-right corner can help with product and build questions." },
        { heading: "Order help", body: "Track or manage your orders from your Account page. You can cancel an order while it is still Pending or Processing." },
        { heading: "Build assistance", body: "Use the PC Builder to assemble a compatible build, or ask our AI consultant for a recommendation based on your budget." },
        { heading: "Returns", body: "Unopened products can be returned within 14 days. Contact support to start a return." },
      ]}
    />
  );
}
