import { Suspense } from "react";
import { CustomLabBuilder } from "@/features/custom-lab";

export default function Page() {
  return (
    <Suspense>
      <CustomLabBuilder />
    </Suspense>
  );
}
