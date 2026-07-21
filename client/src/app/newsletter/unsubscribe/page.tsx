// Server Component — thin page
import { Suspense } from "react";
import { NewsletterUnsubscribe } from "@/features/newsletter/components/NewsletterUnsubscribe";

export default function Page() {
  return (
    <Suspense>
      <NewsletterUnsubscribe />
    </Suspense>
  );
}
