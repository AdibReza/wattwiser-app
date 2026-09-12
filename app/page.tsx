import { redirect } from "next/navigation";

// Screen map: `/` redirects to `/dashboard` (docs/specs/screens.md)
export default function Home() {
  redirect("/dashboard");
}
