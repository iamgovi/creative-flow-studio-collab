import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { MyTask, MyPriority } from "@/data/myTasks";

// Manager-only: create a standalone personal to-do (no assignee, no client link).
export function NewTaskModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (task: MyTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MyPriority>("medium");
  const [deadline, setDeadline] = useState("");

  const reset = () => { setTitle(""); setDescription(""); setPriority("medium"); setDeadline(""); };
  const close = () => { reset(); onClose(); };

  const submit = () => {
    if (!title.trim()) return;
    const deadlineIso = deadline
      ? new Date(deadline).toISOString()
      : new Date(Date.now() + 7 * 86400_000).toISOString();
    onCreate({
      id: `mgr-p-${Date.now()}`,
      title: title.trim(),
      projectId: "",
      lifecycle: "assigned",
      priority,
      deadline: deadlineIso,
      accumulatedMin: 0,
      comments: description.trim() ? 1 : 0,
      attachments: 0,
      revisions: 0,
      source: "personal",
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New personal task</DialogTitle>
          <DialogDescription>
            A to-do just for you — not tied to any client deliverable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nt-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="nt-title" autoFocus className="mt-1.5"
              placeholder="e.g. Prepare Q3 team review"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="nt-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="nt-desc" className="mt-1.5" rows={3}
              placeholder="Any details…"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MyPriority)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nt-deadline">Deadline <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="nt-deadline" type="date" className="mt-1.5"
                value={deadline} onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Create task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
