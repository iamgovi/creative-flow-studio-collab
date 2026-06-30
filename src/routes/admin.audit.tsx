import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ScrollText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/audit")({
  component: AuditLogPage,
});

function AuditLogPage() {
  const auditLogsQuery = useAuditLogs();
  const logs = auditLogsQuery.data ?? [];

  return (
    <AppShell>
      <div className="max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            A complete history of security, account, client, and project activity.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2 font-medium">
              <ScrollText className="size-4" />
              Activity
            </div>
          </div>

          {auditLogsQuery.isLoading ? (
            <AuditState title="Loading audit logs" body="Fetching the latest audit activity from Supabase." />
          ) : auditLogsQuery.isError ? (
            <AuditState
              title="Could not load audit logs"
              body={auditLogsQuery.error instanceof Error ? auditLogsQuery.error.message : "Unknown error"}
              destructive
            />
          ) : logs.length === 0 ? (
            <AuditState title="No audit entries yet" body="New audited activity will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">Timestamp</th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">User</th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">Action</th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">Entity type</th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">Entity name</th>
                    <th className="min-w-[260px] px-5 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-accent/40">
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        <div>{new Date(entry.timestamp).toLocaleString()}</div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-medium">{entry.user}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {entry.actionLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{entry.entityType}</td>
                      <td className="whitespace-nowrap px-5 py-3">{entry.entityName}</td>
                      <td className="px-5 py-3 text-muted-foreground">{entry.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function AuditState({
  title,
  body,
  destructive,
}: {
  title: string;
  body: string;
  destructive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <ScrollText className={cn("mb-3 size-10 text-muted-foreground", destructive && "text-destructive")} />
      <h3 className="font-semibold">{title}</h3>
      <p className={cn("mt-1 max-w-sm text-sm text-muted-foreground", destructive && "text-destructive")}>
        {body}
      </p>
    </div>
  );
}
