import { Card, CardContent } from "@/components/ui/card";

/** What a screen shows when there is nothing yet. Always says what to do next. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
