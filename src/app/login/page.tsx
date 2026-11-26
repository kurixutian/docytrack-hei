import { redirect } from "next/navigation";

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const params = new URLSearchParams({ auth: "signin" });
  if (searchParams.callbackUrl) params.set("callbackUrl", searchParams.callbackUrl);
  redirect(`/?${params.toString()}`);
}
