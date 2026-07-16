// Server Component — thin page
import { Suspense } from "react";
import { VerifyEmailPage } from "@/features/auth/components/VerifyEmailPage";

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
