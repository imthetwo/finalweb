// Server Component — thin page
import { Suspense } from "react";
import { GuestCheckoutConfirmPage } from "@/features/checkout/components/GuestCheckoutConfirmPage";

export default function Page() {
  return (
    <Suspense>
      <GuestCheckoutConfirmPage />
    </Suspense>
  );
}
