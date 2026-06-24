import InfoPage from "./InfoPage";

export function WarrantyPage() {
  return (
    <InfoPage
      eyebrow="Peace of mind"
      title="Warranty"
      intro="Every product sold by Pecify is covered by a manufacturer warranty, backed by our own support."
      sections={[
        { heading: "Coverage", body: "Components carry a 2-year warranty against manufacturing defects. Prebuilt PCs include 2 years parts & labour, assembled and tested in-house." },
        { heading: "What's covered", body: "Manufacturing defects, dead-on-arrival units, and hardware failures under normal use." },
        { heading: "What's not covered", body: "Physical damage, liquid damage, overclocking damage, and normal wear of consumables." },
        { heading: "How to claim", body: "Contact support with your order ID. We'll arrange inspection, repair, or replacement as quickly as possible." },
      ]}
    />
  );
}
