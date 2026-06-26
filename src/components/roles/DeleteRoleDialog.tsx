import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/stores/roles";
import { toast } from "sonner";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

interface Props {
  roleId: string;
  onClose: () => void;
}

export function DeleteRoleDialog({ roleId, onClose }: Props) {
  const roles = useRoles((s) => s.roles);
  const allEmployees = useRoles((s) => s.employees);
  const archiveRole = useRoles((s) => s.archiveRole);
  const deleteEmpty = useRoles((s) => s.deleteEmpty);

  const role = roles.find((r) => r.id === roleId);
  const employees = useMemo(
    () =>
      (role?.assignedIds ?? [])
        .map((id) => allEmployees.find((e) => e.id === id))
        .filter(isDefined),
    [allEmployees, role],
  );
  const targets = roles.filter((r) => r.id !== roleId && !r.archived);

  const [bulk, setBulk] = useState<string>("");
  const [perEmp, setPerEmp] = useState<Record<string, string>>({});

  if (!role) return null;
  const hasAssignees = employees.length > 0;

  const allReady = !hasAssignees || employees.every((e) => Boolean(perEmp[e.id]));

  const applyBulk = () => {
    if (!bulk) return;
    const next: Record<string, string> = {};
    for (const e of employees) next[e.id] = bulk;
    setPerEmp(next);
  };

  const onConfirm = async () => {
    if (!hasAssignees) {
      try {
        await deleteEmpty(role.id);
        toast.success(`Role '${role.name}' archived.`);
        onClose();
      } catch (error) {
        toast.error("Unable to delete role", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      return;
    }
    try {
      await archiveRole(role.id, perEmp);
      toast.success(`Role archived. ${employees.length} employees reassigned.`);
      onClose();
    } catch (error) {
      toast.error("Unable to delete role", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  if (!hasAssignees) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete '{role.name}'?</DialogTitle>
            <DialogDescription>
              This action can be undone from Archived Roles within 30 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reassign employees before deleting</DialogTitle>
          <DialogDescription>
            {employees.length} employees are currently assigned to <b>{role.name}</b>. Reassign them
            to another role to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
          <span className="text-sm text-muted-foreground shrink-0">Reassign All To:</span>
          <Select value={bulk} onValueChange={setBulk}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {targets.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" onClick={applyBulk} disabled={!bulk}>
            Apply to All
          </Button>
        </div>

        <div className="max-h-72 overflow-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs">
              <tr>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Current</th>
                <th className="px-3 py-2 font-medium">New Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={e.avatar} />
                        <AvatarFallback>{e.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-[10px] text-muted-foreground">{e.jobRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{role.name}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={perEmp[e.id] || ""}
                      onValueChange={(v) => setPerEmp((p) => ({ ...p, [e.id]: v }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Pick role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!allReady} onClick={onConfirm}>
            Reassign &amp; Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
