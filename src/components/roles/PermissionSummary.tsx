import { Card } from "@/components/ui/card";
import { MODULES, ACTIONS, ACTION_LABEL, type PermissionMap } from "@/data/permissions";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  perms: PermissionMap;
  roleName?: string;
}

export function PermissionSummary({ perms, roleName }: Props) {
  const can: string[] = [];
  const cannot: string[] = [];

  for (const m of MODULES) {
    const granted = ACTIONS.filter((a) => m.supports.includes(a) && perms[m.key]?.[a]);
    if (granted.length === 0) {
      cannot.push(`Access ${m.verbModule}`);
      continue;
    }
    if (granted.length === m.supports.length) {
      can.push(`Full access to ${m.verbModule}`);
      continue;
    }
    const verbs = granted.map((g) => ACTION_LABEL[g].toLowerCase());
    can.push(`${capitalize(joinList(verbs))} ${m.verbModule}`);
  }

  const empty = can.length === 0;

  return (
    <Card className="p-5 sticky top-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Permission summary</div>
      <div className="mt-1 font-medium">{roleName || "This role"}</div>

      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" /> Will be able to
        </div>
        {empty ? (
          <p className="mt-2 text-sm text-muted-foreground italic">No permissions granted yet</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {can.map((c, i) => (
              <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span><span>{c}</span></li>
            ))}
          </ul>
        )}
      </div>

      {cannot.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <XCircle className="size-3.5" /> Will NOT be able to
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {cannot.map((c, i) => (
              <li key={i} className="flex gap-2"><span>•</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
