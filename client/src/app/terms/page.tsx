import InfoPage from "@/features/static/InfoPage";

export const metadata = { title: "Terms of Use | Pecify" };

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="The rules"
      title="Terms of Use"
      intro="By using Pecify you agree to the following terms."
      sections={[
        { heading: "Accounts", body: "You are responsible for keeping your account credentials secure and for all activity under your account." },
        { heading: "Orders & pricing", body: "All prices are in VND and may change without notice. We reserve the right to cancel orders in case of pricing errors or stock issues." },
        { heading: "Acceptable use", body: "Do not misuse the service, attempt to disrupt it, or use it for unlawful purposes." },
        { heading: "Liability", body: "Products are covered by their respective warranties. Pecify is not liable for indirect or consequential damages." },
      ]}
    />
  );
}
