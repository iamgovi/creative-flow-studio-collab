import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, AlertTriangle, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRoles } from "@/stores/roles";
import { JOB_ROLES, type RoleLevel, type RoleRecord } from "@/types/employees";
import { applyDependencies, type PermissionMap } from "@/data/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LEVELS = JOB_ROLES;

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

interface Props {
  mode: "create" | "edit" | "view";
  initial?: RoleRecord;
}

export function RoleEditor({ mode, initial }: Props) {
  const navigate = useNavigate();
  const roles = useRoles((s) => s.roles);
  const employees = useRoles((s) => s.employees);
  const createRole = useRoles((s) => s.createRole);
  const upsertRole = useRoles((s) => s.upsertRole);
  const cloneRole = useRoles((s) => s.cloneRole);

  const readOnly = mode === "view";
  const isSystem = initial?.type === "system";
  // System view: only description editable
  const lockNonDesc = readOnly || (mode === "edit" && isSystem);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [level, setLevel] = useState<RoleLevel | "">(initial?.level ?? "");
  const [perms, setPerms] = useState<PermissionMap>(initial?.permissions ?? {});
  const [confirmSave, setConfirmSave] = useState(false);
  const [showAffected, setShowAffected] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const assigned = useMemo(
    () =>
      (initial?.assignedIds ?? [])
        .map((id) => employees.find((e) => e.id === id))
        .filter(isDefined),
    [employees, initial],
  );

  const checkName = (n: string) => {
    const trimmed = n.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length > 50) return "Max 50 characters";
    const dup = roles.find(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase() && r.id !== initial?.id && !r.archived,
    );
    if (dup) return "A role with this name already exists";
    return null;
  };

  const dirty = !initial
    ? true
    : name !== initial.name ||
      description !== initial.description ||
      level !== initial.level ||
      JSON.stringify(applyDependencies(perms)) !==
        JSON.stringify(applyDependencies(initial.permissions));

  const changed = {
    name: initial ? name !== initial.name : false,
    description: initial ? description !== initial.description : false,
    level: initial ? level !== initial.level : false,
  };

  const canSave =
    !readOnly &&
    dirty &&
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    level &&
    !nameError;

  const doSave = async () => {
    const err = checkName(name);
    if (err) {
      setNameError(err);
      return;
    }
    if (mode === "create") {
      try {
        await createRole({
          name: name.trim(),
          description: description.trim(),
          level: level as RoleLevel,
          permissions: perms,
        });
        toast.success("Custom role created");
        navigate({ to: "/admin/employees/roles" });
      } catch (error) {
        toast.error("Unable to create role", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      return;
    }
    if (mode === "edit" && initial) {
      try {
        await upsertRole({
          ...initial,
          name: name.trim(),
          description: description.trim(),
          level: level as RoleLevel,
          permissions: perms,
        });
        toast.success("Role updated. Affected employees will see changes shortly.");
        navigate({ to: "/admin/employees/roles" });
      } catch (error) {
        toast.error("Unable to update role", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    }
  };

  const handleSaveClick = () => {
    if (mode === "edit" && assigned.length > 0) setConfirmSave(true);
    else doSave();
  };

  const handleClone = async () => {
    if (!initial) return;
    try {
      const rec = await cloneRole(initial.id);
      if (rec) {
        toast.success(`Cloned from ${initial.name}. Customize and save.`);
        navigate({ to: "/admin/employees/roles/$id", params: { id: rec.id } });
      }
    } catch (error) {
      toast.error("Unable to clone role", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  // Reset state if initial changes (e.g., after clone navigates to a new id)
  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description);
      setLevel(initial.level);
      setPerms(initial.permissions);
    }
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const title =
    mode === "create"
      ? "Add New Team Mate"
      : mode === "view" || (mode === "edit" && isSystem)
        ? (initial?.name ?? "Role")
        : `Edit ${initial?.name}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to="/admin/employees/roles">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{title}</h1>
            {initial && (
              <div className="text-xs text-muted-foreground">
                {initial.type === "system" ? "System role" : "Custom role"}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(mode === "view" ||
            (mode === "edit" && isSystem && initial?.name !== "Super Admin")) && (
            <Button variant="outline" onClick={handleClone}>
              <Copy className="size-4" /> Clone
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link to="/admin/employees/roles">Cancel</Link>
          </Button>
          {!readOnly && (
            <Button disabled={!canSave} onClick={handleSaveClick}>
              Save Role
            </Button>
          )}
        </div>
      </div>

      {isSystem && (mode === "view" || mode === "edit") && (
        <Card className="p-4 bg-slate-50 dark:bg-white/[0.02] border-slate-300/40 flex items-center justify-between gap-4">
          <div className="text-sm">
            <b>System role.</b>{" "}
            {mode === "edit"
              ? "Only the description can be modified."
              : " You can clone this role to create a custom variant."}
          </div>
          {mode === "view" && (
            <Button size="sm" onClick={handleClone}>
              Clone This Role
            </Button>
          )}
        </Card>
      )}

      {mode === "edit" && !isSystem && assigned.length > 0 && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/10">
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 mt-0.5 text-amber-600 shrink-0" />
              <div>
                This role is currently assigned to <b>{assigned.length} employees</b>. Changes will
                affect all of them immediately on their next page navigation.
              </div>
            </div>
            <button
              className="text-amber-700 dark:text-amber-300 hover:underline shrink-0 inline-flex items-center gap-1"
              onClick={() => setShowAffected((s) => !s)}
            >
              View Affected{" "}
              <ChevronDown
                className={cn("size-3.5 transition-transform", showAffected && "rotate-180")}
              />
            </button>
          </div>
          {showAffected && (
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {assigned.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 bg-card rounded-md p-2 border text-sm"
                >
                  <Avatar className="size-7">
                    <AvatarImage src={e.avatar} />
                    <AvatarFallback>{e.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{e.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {e.email} · {e.jobRole}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div>
        <Card className="p-5 space-y-4">
          <div>
            <Label className="text-sm">
              Name <span className="text-destructive">*</span>
              {changed.name && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500" />
              )}
            </Label>
            <Input
              value={name}
              disabled={lockNonDesc}
              maxLength={50}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              onBlur={() => setNameError(checkName(name))}
              className="mt-1.5"
              placeholder="e.g., Marketing Executive — APAC"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={cn(nameError ? "text-destructive" : "text-muted-foreground")}>
                {nameError ?? " "}
              </span>
              <span className="text-muted-foreground tabular-nums">{name.length}/50</span>
            </div>
          </div>

          <div>
            <Label className="text-sm">
              Description <span className="text-destructive">*</span>
              {changed.description && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500" />
              )}
            </Label>
            <Textarea
              value={description}
              disabled={readOnly}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5"
              placeholder="This will be shown as a tooltip when assigning this role to employees."
            />
            <div className="mt-1 text-xs text-muted-foreground text-right tabular-nums">
              {description.length}/200
            </div>
          </div>

          <div>
            <Label className="text-sm">
              Role <span className="text-destructive">*</span>
              {changed.level && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500" />
              )}
            </Label>
            <Select
              value={level || undefined}
              onValueChange={(v) => setLevel(v as RoleLevel)}
              disabled={lockNonDesc}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply changes to {assigned.length} employees?</AlertDialogTitle>
            <AlertDialogDescription>
              Their access will update on next page navigation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmSave(false);
                void doSave();
              }}
            >
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
