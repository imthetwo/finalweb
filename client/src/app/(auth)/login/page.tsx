import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

// There's no standalone login page — sign-in only exists as the LoginOverlay
// dialog, opened from the navbar (see useMainNav). Landing here (e.g. an auth
// guard bouncing an unauthenticated visitor) redirects home with a query flag
// that tells the navbar to auto-open that dialog, plus where to send the user
// back to once they're signed in (see useMainNav.ts / useLoginForm.ts).
export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;
  const qs = new URLSearchParams({ login: "1" });
  if (redirectTo) qs.set("redirect", redirectTo);
  redirect(`/?${qs.toString()}`);
}
