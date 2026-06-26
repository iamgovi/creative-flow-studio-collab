import { createFileRoute, redirect } from "@tanstack/react-router";

// Any unmatched path (including old, non-namespaced bookmarks) bounces to the
// role-selection screen rather than rendering a broken half-state.
export const Route = createFileRoute("/$")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});