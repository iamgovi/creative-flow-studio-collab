// The manager's personal task board store. Built from the SAME factory as the
// employee board, so it inherits every behavior (timer, one-active rule, drag
// lifecycle, submit-for-review) while staying an isolated instance seeded with
// the manager's own work.
import { createTaskStore } from "@/hooks/useActiveTask";
import { initialManagerTasks } from "@/data/mockManagerTasks";

export const useManagerTasks = createTaskStore(initialManagerTasks);
