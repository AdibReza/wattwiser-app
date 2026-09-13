// The sign-in screens sit outside the (app) group on purpose: no sidebar, and
// no session requirement. proxy.ts sends anyone already signed in to /dashboard.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
