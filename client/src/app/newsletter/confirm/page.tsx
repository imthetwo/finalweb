// Server Component — thin page
import { Suspense } from "react";
import { NewsletterConfirm } from "@/features/newsletter/components/NewsletterConfirm";

export default function Page() {
  return (
    <Suspense>
      <NewsletterConfirm />
    </Suspense>
  );
}
