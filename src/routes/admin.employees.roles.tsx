import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Search, Plus, MoreHorizontal, Copy, Pencil, Trash2, Eye } from "lucide-react";
import { useRoles } from "@/stores/roles";
import { toast } from "sonner";
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/employees/roles")({ component: RolesList });

type SortKey = "name" | "role";
const UNASSIGNED_ROLE_ID = "__unassigned_role__";

function RolesList() {
  const roles = useRoles((s) => s.roles).filter((r) => !r.archived);
  const employees = useRoles((s) => s.employees);
  const loading = useRoles((s) => s.loading);
  const error = useRoles((s) => s.error);
  const loaded = useRoles((s) => s.loaded);
  const loadRoles = useRoles((s) => s.loadRoles);
  const cloneRole = useRoles((s) => s.cloneRole);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const rows = useMemo(() => {
    let list = employees.map((employee) => ({
      employee,
      role: roles.find((r) => r.assignedIds.includes(employee.id)) ?? null,
    }));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        ({ employee, role }) =>
          employee.name.toLowerCase().includes(q) ||
          employee.email.toLowerCase().includes(q) ||
          employee.jobRole.toLowerCase().includes(q) ||
          role?.name.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
    if (sort === "role")
      sorted.sort((a, b) => a.employee.jobRole.localeCompare(b.employee.jobRole));
    return sorted;
  }, [employees, roles, query, sort]);

  useEffect(() => {
    if (!loaded) void loadRoles();
  }, [loadRoles, loaded]);

  const onClone = async (id: string) => {
    const rec = await cloneRole(id);
    if (!rec) return;
    toast.success(`Cloned. Customize and save.`);
    navigate({ to: "/admin/employees/roles/$id", params: { id: rec.id } });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Roles</h1>
          <p className="text-sm text-muted-foreground">Your team and the roles they hold</p>
        </div>
        <Button asChild>
          <Link to="/admin/employees/roles/new">
            <Plus className="size-4" /> Invite Team Member
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative w-[240px]">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team..."
            className="pl-8 h-9"
          />
        </div>
        <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="role">Role A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={150}>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium">Full Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Job Role</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ employee, role }) => (
                  <tr
                    key={`${role?.id ?? UNASSIGNED_ROLE_ID}-${employee.id}`}
                    className={cn("border-b last:border-b-0 hover:bg-muted/30 cursor-pointer")}
                    onClick={() => {
                      if (role)
                        navigate({ to: "/admin/employees/roles/$id", params: { id: role.id } });
                    }}
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback>{employee.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{employee.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-muted-foreground">{employee.email}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-muted-foreground">{employee.jobRole}</span>
                    </td>
                    <td
                      className="px-4 py-3 align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!role}
                            onClick={() =>
                              role &&
                              navigate({
                                to: "/admin/employees/roles/$id",
                                params: { id: role.id },
                              })
                            }
                          >
                            <Eye className="size-4" /> View Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!role}
                            onClick={() =>
                              role &&
                              navigate({
                                to: "/admin/employees/roles/$id",
                                params: { id: role.id },
                                search: { edit: true },
                              })
                            }
                          >
                            <Pencil className="size-4" /> Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!role}
                            onClick={() => role && onClone(role.id)}
                          >
                            <Copy className="size-4" /> Clone Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={!role || role.type === "system"}
                            className="text-destructive focus:text-destructive"
                            onClick={() => role && setDeleteRoleId(role.id)}
                          >
                            <Trash2 className="size-4" /> Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Loading team members...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-destructive">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No team members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </Card>

      {deleteRoleId && (
        <DeleteRoleDialog roleId={deleteRoleId} onClose={() => setDeleteRoleId(null)} />
      )}
    </div>
  );
}
