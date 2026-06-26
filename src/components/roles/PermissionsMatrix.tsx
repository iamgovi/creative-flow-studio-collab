import { useState } from "react";
import {
  Megaphone, BarChart3, Users, FolderOpen, Settings, CreditCard, UserCog, Plug, ScrollText, Lock, Shield, AlertTriangle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ACTIONS, ACTION_LABEL, MODULES, PERMISSION_DESCRIPTIONS, allPermissions, lockedFor,
  type ActionKey, type ModuleKey, type PermissionMap,
} from "@/data/permissions";
import { cn } from "@/lib/utils";

const ICONS = { Megaphone, BarChart3, Users, FolderOpen, Settings, CreditCard, UserCog, Plug, ScrollText };

interface Props {
  value: PermissionMap;
  onChange: (next: PermissionMap) => void;
  readOnly?: boolean;
  roleLevel?: string;
}

function isOn(perms: PermissionMap, m: ModuleKey, a: ActionKey) {
  return Boolean(perms[m]?.[a]);
}

function moduleRowState(perms: PermissionMap, m: typeof MODULES[number]) {
  const granted = m.supports.filter((a) => isOn(perms, m.key, a)).length;
  if (granted === 0) return "none" as const;
  if (granted === m.supports.length) return "all" as const;
  return "partial" as const;
}

export function PermissionsMatrix({ value, onChange, readOnly = false, roleLevel }: Props) {
  const [confirmFull, setConfirmFull] = useState(false);
  const [warnApprove, setWarnApprove] = useState<null | { m: ModuleKey; a: ActionKey; next: boolean }>(null);

  const setCell = (m: ModuleKey, a: ActionKey, next: boolean) => {
    if (readOnly) return;
    const mod = MODULES.find((x) => x.key === m)!;
    if (!mod.supports.includes(a)) return;

    // billing.approve change requires confirmation
    if (m === "billing" && a === "approve") {
      setWarnApprove({ m, a, next });
      return;
    }
    applyCell(m, a, next);
  };

  const applyCell = (m: ModuleKey, a: ActionKey, next: boolean) => {
    const cur = { ...(value[m] || {}) };
    cur[a] = next;
    // if turning OFF a parent, unlock dependents but leave them on so user can manually clear
    onChange({ ...value, [m]: cur });
  };

  const setRowAll = (m: ModuleKey, on: boolean) => {
    if (readOnly) return;
    const mod = MODULES.find((x) => x.key === m)!;
    const cur: Partial<Record<ActionKey, boolean>> = {};
    if (on) for (const a of mod.supports) cur[a] = true;
    onChange({ ...value, [m]: cur });
  };

  const setColAll = (a: ActionKey, on: boolean) => {
    if (readOnly) return;
    const next = { ...value };
    for (const mod of MODULES) {
      if (!mod.supports.includes(a)) continue;
      const cur = { ...(next[mod.key] || {}) };
      cur[a] = on;
      next[mod.key] = cur;
    }
    onChange(next);
  };

  const fullAccessOn = MODULES.every((m) => m.supports.every((a) => isOn(value, m.key, a)));

  const grantFullAccess = () => {
    onChange(allPermissions());
    setConfirmFull(false);
  };

  const revokeFullAccess = () => onChange({});

  const empWarn =
    roleLevel &&
    !["Manager-Level", "Executive"].includes(roleLevel) &&
    MODULES.find((m) => m.key === "employees")!.supports.some((a) => isOn(value, "employees", a));

  return (
    <TooltipProvider delayDuration={150}>
      {/* Master full access card */}
      <Card className="p-4 mb-4 bg-primary/5 border-primary/30 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-9 rounded-md grid place-items-center bg-primary/15 text-primary shrink-0">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm">Grant Full Access</div>
            <div className="text-xs text-muted-foreground">
              Grants every permission across every module. Equivalent to Admin access — use with caution.
            </div>
          </div>
        </div>
        <Switch
          checked={fullAccessOn}
          disabled={readOnly}
          onCheckedChange={(on) => (on ? setConfirmFull(true) : revokeFullAccess())}
        />
      </Card>

      {empWarn && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>
            <b>Employees &amp; Roles</b> permissions are typically reserved for Manager-Level and above.
            Consider increasing the Role Level if this role needs to manage other employees.
          </span>
        </div>
      )}

      {/* Desktop matrix */}
      <Card className="hidden md:block overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b">
                <th className="text-left font-medium px-4 py-2.5 w-[220px]" aria-label="Module" />
                {ACTIONS.map((a) => (
                  <th key={a} className="font-medium px-2 py-2.5 text-center w-[88px]">{ACTION_LABEL[a]}</th>
                ))}
                <th className="font-medium px-2 py-2.5 text-center w-[72px]">All</th>
              </tr>
              <tr className="border-b bg-muted/40">
                <td className="px-4 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Select all in column</td>
                {ACTIONS.map((a) => {
                  const eligible = MODULES.filter((m) => m.supports.includes(a));
                  const on = eligible.length > 0 && eligible.every((m) => isOn(value, m.key, a));
                  return (
                    <td key={a} className="px-2 py-1.5 text-center">
                      <Switch checked={on} disabled={readOnly} onCheckedChange={(v) => setColAll(a, v)} />
                    </td>
                  );
                })}
                <td />
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => {
                const Icon = ICONS[m.icon];
                const rowState = moduleRowState(value, m);
                const rowAll = rowState === "all";
                const locked = lockedFor(value[m.key]);
                return (
                  <tr key={m.key} className="border-b last:border-b-0 hover:bg-muted/30 group">
                    <td className="relative px-4 py-2.5">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-0.5",
                          rowState === "all" && "bg-emerald-500",
                          rowState === "partial" && "bg-primary",
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    {ACTIONS.map((a) => {
                      const supports = m.supports.includes(a);
                      if (!supports) return <td key={a} className="text-center text-muted-foreground/40">—</td>;
                      const on = isOn(value, m.key, a);
                      const isLocked = locked.has(a) && on;
                      const key = `${m.key}.${a}`;
                      return (
                        <td key={a} className="px-2 py-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 align-middle">
                                <Switch
                                  checked={on}
                                  disabled={readOnly || isLocked}
                                  onCheckedChange={(v) => setCell(m.key, a, v)}
                                  className={cn(on && "data-[state=checked]:bg-emerald-500")}
                                />
                                {isLocked && <Lock className="size-3 text-emerald-600" />}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px]">
                              <div className="font-mono text-[10px] opacity-80">{key}</div>
                              <div>
                                {isLocked
                                  ? "Auto-granted — you can't update what you can't read."
                                  : PERMISSION_DESCRIPTIONS[key] ?? ACTION_LABEL[a]}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center">
                      <Switch checked={rowAll} disabled={readOnly} onCheckedChange={(v) => setRowAll(m.key, v)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile accordion */}
      <div className="md:hidden">
        <Accordion type="multiple" className="space-y-2">
          {MODULES.map((m) => {
            const Icon = ICONS[m.icon];
            const rowState = moduleRowState(value, m);
            const locked = lockedFor(value[m.key]);
            return (
              <AccordionItem key={m.key} value={m.key} className="border rounded-lg px-3 bg-card">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="font-medium">{m.name}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      rowState === "all" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                      rowState === "partial" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground",
                    )}>{rowState}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  {m.supports.map((a) => {
                    const on = isOn(value, m.key, a);
                    const isLocked = locked.has(a) && on;
                    return (
                      <div key={a} className="flex items-center justify-between text-sm py-1">
                        <span className="flex items-center gap-1.5">
                          {ACTION_LABEL[a]}
                          {isLocked && <Lock className="size-3 text-emerald-600" />}
                        </span>
                        <Switch
                          checked={on}
                          disabled={readOnly || isLocked}
                          onCheckedChange={(v) => setCell(m.key, a, v)}
                          className={cn(on && "data-[state=checked]:bg-emerald-500")}
                        />
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <AlertDialog open={confirmFull} onOpenChange={setConfirmFull}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant full admin-equivalent access?</AlertDialogTitle>
            <AlertDialogDescription>
              This role will be able to perform any action in any module, including managing other employees and roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={grantFullAccess}>Grant Full Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!warnApprove} onOpenChange={(v) => !v && setWarnApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm billing approval permission</AlertDialogTitle>
            <AlertDialogDescription>
              Approve permissions on Billing allow this role to authorize plan changes and payments. Confirm?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (warnApprove) applyCell(warnApprove.m, warnApprove.a, warnApprove.next);
              setWarnApprove(null);
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
