import InfoPage from "@/features/static/InfoPage";

export const metadata = { title: "Privacy Policy | Pecify" };

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Your data"
      title="Privacy Policy"
      intro="We respect your privacy and only collect the data needed to operate the store."
      sections={[
        { heading: "What we collect", body: "Account details (name, email, phone), order and shipping information, and basic usage data to improve the experience." },
        { heading: "How we use it", body: "To process orders, provide support, send order updates and — if you subscribe — our newsletter. We never sell your data." },
        { heading: "Email & marketing", body: "You can unsubscribe from the newsletter at any time via the link in any email." },
        { heading: "Security", body: "Passwords are hashed with bcrypt and all traffic is encrypted in transit." },
      ]}
    />
  );
}
