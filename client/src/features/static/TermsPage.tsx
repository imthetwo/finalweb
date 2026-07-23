import InfoPage from "./InfoPage";

export function TermsPage() {
  return (
    <InfoPage
      eyebrow="The rules"
      title="Terms of Use"
      intro="By creating an account or placing an order on Pecify, you agree to the terms below. If anything is unclear, contact support before you buy."
      sections={[
        {
          heading: "Accounts",
          body: [
            "You're responsible for keeping your login credentials secure, and for all activity that happens under your account.",
            "Guest checkout is available without an account — your order is instead tied to the email and phone number you provide at checkout.",
            "Tell us immediately if you suspect unauthorized access to your account.",
          ],
        },
        {
          heading: "Orders & pricing",
          body: [
            "All prices are listed in VND and may change without notice; the price shown at checkout is the one that applies to your order.",
            "We reserve the right to cancel or refuse an order in case of a pricing error, a description error, or insufficient stock — you'll be notified and refunded in full if this happens after payment.",
            "An order isn't confirmed until it reaches Awaiting Confirmation status; placing an order doesn't guarantee stock is reserved until then.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "We accept Cash on Delivery (COD) and MoMo. COD payment is collected by the courier at the time of delivery.",
            "MoMo payments are processed by MoMo directly — Pecify never sees or stores your card or wallet credentials.",
            "Refunds for paid orders are issued back to the original MoMo wallet once a cancellation or return is approved.",
          ],
        },
        {
          heading: "Cancellations",
          body: [
            "You may cancel an order yourself while it's still Pending, Awaiting Confirmation, or Processing.",
            "Once an order has shipped, it can no longer be self-cancelled — contact support instead.",
            "A paid MoMo order that needs to be cancelled after payment is handled as a refund, not a self-cancel.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Don't misuse the service: no scraping, no automated bulk ordering, no attempting to disrupt or gain unauthorized access to the store or its systems.",
            "Don't use Pecify, including the AI assistant, for unlawful purposes or to attempt to extract data you're not authorized to access.",
          ],
        },
        {
          heading: "Liability",
          body: "Products are covered by their respective manufacturer warranties (see our Warranty page for details). To the extent permitted by law, Pecify is not liable for indirect, incidental, or consequential damages arising from the use of our products or service.",
        },
      ]}
    />
  );
}
