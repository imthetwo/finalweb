// Server Component — thin page
import { Suspense } from "react";
import { OrderSuccess } from "@/features/order/components/OrderSuccess";

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccess />
    </Suspense>
  );
}
