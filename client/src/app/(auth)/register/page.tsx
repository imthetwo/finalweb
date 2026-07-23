import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

// Same reasoning as login/page.tsx — no standalone register page, sign-up
// only exists as the RegisterOverlay dialog.
export default async function RegisterPage({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;
  const qs = new URLSearchParams({ register: "1" });
  if (redirectTo) qs.set("redirect", redirectTo);
  redirect(`/?${qs.toString()}`);
}
