// Server Component — thin page
import { Suspense } from "react";
import { PaymentGateway } from "@/features/payment/components/PaymentGateway";

export default function PaymentGatewayPage() {
  return (
    <Suspense>
      <PaymentGateway />
    </Suspense>
  );
}
