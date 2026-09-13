import Link from "next/link";
import { Zap } from "lucide-react";

/** The WattWiser mark. Used by the app sidebar and by the sign-in screens. */
export function Brand({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 text-lg font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="size-4" aria-hidden />
      </span>
      WattWiser
    </Link>
  );
}
