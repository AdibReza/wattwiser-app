import { Card, CardContent } from "@/components/ui/card";
import { Brand } from "@/components/layout/brand";

/**
 * The centred card both sign-in screens sit in. Same proportions as the
 * calibration wizard's shell, narrower, with the WattWiser mark above it.
 */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Brand href="/" />
      <Card className="w-full max-w-sm gap-0 py-0">
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
