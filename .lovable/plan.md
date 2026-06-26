
# Isolate Admin / Manager / Employee views by URL

## The root cause (confirmed in code)

The bug is exactly what your spec predicts, with two concrete mechanisms in this codebase:

1. **A mutable, persisted "current role" store.** `src/stores/role.ts` holds `role` in a zustand store persisted to localStorage. The shell (`app-sidebar.tsx`, `top-bar.tsx`) renders entirely from `useRole((s) => s.role)`.
2. **Shared, non-namespaced routes that mutate that store.** `/clients`, `/team`, `/projects`, `/analytics`, `/reviews`, `/employees` are single components reachable from multiple sidebars, and each calls `setRole(...)` in a `useEffect`. So visiting `/clients` flips the role to `admin` and the whole shell becomes Admin — regardless of who you were. The sidebar links point to bare paths (`/clients`), so role context is decided by whichever page's effect last ran.

There are also several **dead nav links** today (`/timesheet`, `/notifications`, `/tasks`, `/audit`, `/settings` have no route files).

## Framework note (important)

This project is **TanStack Start**, not react-router-dom. There is no `createBrowserRouter`. Routing is file-based under `src/routes/` and `routeTree.gen.ts` is auto-generated. I will implement the *identical architecture* you described using TanStack idioms:

- `react-router` nested `children` → TanStack **layout route** files (`admin.tsx` renders `<Outlet/>`, children are `admin.dashboard.tsx`, etc.).
- `<NavLink>` active state → TanStack `<Link activeProps={...} activeOptions={...}>` (active derived purely from URL).
- `useRole()` URL hook → `useCurrentRole()` reading `useRouterState` pathname.
- `<Navigate>` → `beforeLoad: () => throw redirect(...)`.

## Target route map

```text
/                         RoleSelect (login) — only shared route

/admin            -> AdminLayout  (Admin sidebar + topbar + Outlet)
  /admin              -> redirect to /admin/dashboard
  /admin/dashboard
  /admin/clients
  /admin/projects
  /admin/analytics
  /admin/employees   (+ /admin/employees/roles, /roles/$id, /roles/new)
  /admin/audit        (new placeholder)
  /admin/settings     (new placeholder)

/manager          -> ManagerLayout
  /manager            -> redirect to /manager/dashboard
  /manager/dashboard
  /manager/clients
  /manager/projects   (+ /manager/projects/$id/setup)
  /manager/tasks      (new — manager task overview)
  /manager/reviews
  /manager/analytics  (+ /manager/analytics/employee/$id)
  /manager/team

/employee         -> EmployeeLayout
  /employee           -> redirect to /employee/dashboard
  /employee/dashboard
  /employee/tasks     (+ /employee/tasks/$taskId)
  /employee/timesheet (new placeholder)
  /employee/team
  /employee/games
  /employee/notifications (new placeholder)

*  -> redirect to /
```

No screen is ever shared between roles at the same URL. Where two roles show the same UI (Clients, Projects, Team, Analytics), the body becomes a **prop/URL-driven presentational view** in `src/components/views/`, composed by each role's own route file — exactly the "shared dumb component, not shared route" rule from your spec.

## How isolation is guaranteed

- **Layout per role.** `admin.tsx`/`manager.tsx`/`employee.tsx` are layout routes. Each mounts its own sidebar + topbar (via a small `RoleShell` that takes the role explicitly) and an `<Outlet/>`. Navigating within `/manager/*` never re-mounts another role's shell; switching roles changes the URL prefix, which unmounts one layout and mounts another.
- **Role is derived from the URL only.** New `useCurrentRole()` reads the pathname. `src/stores/role.ts` loses `role`/`setRole` (keeps only `theme`). Every `setRole(...)` effect is deleted.
- **Active highlight from URL.** Sidebar uses `<Link activeProps>` — cannot desync from the page.
- **Role switcher = navigation.** The login/demo buttons already `navigate()`; they'll target `/<role>/dashboard`. No shared state to flip.

## Technical steps

1. `src/hooks/use-current-role.ts` — `useCurrentRole()` from pathname.
2. `src/components/layout/role-shell.tsx` — `RoleShell` (sidebar + topbar + children). Sidebar nav is a hardcoded per-role list of namespaced paths; active via `Link activeProps`. Topbar identity from current role.
3. Rewrite `app-sidebar.tsx` / `top-bar.tsx` to take role explicitly / derive from URL; drop store-role reads. Strip `role`/`setRole` from `stores/role.ts`.
4. Create the three layout route files + per-role `index` redirects.
5. Extract shared bodies into `src/components/views/` (Clients, Projects, Team, Analytics + its tabs already store-driven). Move single-role bodies (dashboards, reviews, my-tasks, games, employees/roles, project setup, task detail, analytics deep-dive) into their namespaced route files; delete `setRole` and `AppShell` double-wrapping (shell now comes from the layout).
6. Update all internal `<Link to>` / `navigate()` targets to namespaced paths; cross-role-capable links inside shared views resolve against `useCurrentRole()`.
7. Add placeholder pages: `/admin/audit`, `/admin/settings`, `/employee/timesheet`, `/employee/notifications`, `/manager/tasks`.
8. Keep redirects from old bare paths (`/clients` → `/`) via a catch-all so stale bookmarks bounce cleanly.
9. Verify the full matrix from your section 10 with a build + Playwright pass (deep-link refresh, back button, role switch, invalid sub-path redirect).

## Scope decisions (defaults — tell me to change any)

- **Manager keeps** Clients, Projects, Tasks, Reviews, Analytics, Team (per your spec). I'll **drop** Employees and Notifications from the Manager sidebar (they move to Admin / are employee-only). Say the word if Manager should keep Employees.
- **Employee keeps** Team and Games (currently present) in addition to your listed Dashboard/Tasks/Timesheet/Notifications.
- New placeholder pages (audit, settings, timesheet, notifications, manager tasks) ship as clean empty-state screens, ready to fill later.
