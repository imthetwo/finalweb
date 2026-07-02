import { Suspense } from "react";
import CustomLabBuilder from "@/features/custom-lab/components/CustomLabBuilder";

export default function Page() {
  return (
    <Suspense>
      <CustomLabBuilder />
    </Suspense>
  );
}
