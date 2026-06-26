import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AssigneePicker } from "./AssigneePicker";
import { memberById, type TeamMember } from "@/data/mockDeliverablesRelay";

export function RevisionFlow({
  currentAssigneeId,
  onCancel,
  onConfirm,
}: {
  currentAssigneeId?: string;
  onCancel: () => void;
  onConfirm: (notes: string, newAssigneeId?: string) => void;
}) {
  const current = memberById(currentAssigneeId);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"same" | "reassign">("same");
  const [newAssignee, setNewAssignee] = useState<TeamMember | undefined>();

  const canConfirm = notes.trim().length > 0 && (mode === "same" || !!newAssignee);

  return (
    <div className="space-y-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <Label className="text-sm font-medium">What needs to change?</Label>
        <Textarea
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the changes required before this stage can be approved…"
          className="mt-1.5 min-h-24 bg-background"
        />
        {notes.trim().length === 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">Notes are required to request a revision.</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium">Who should redo this stage?</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "same" | "reassign")} className="mt-2 space-y-2">
          <label className={cn("flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer", mode === "same" && "border-primary bg-primary/5")}>
            <RadioGroupItem value="same" />
            <Avatar className="size-7">
              <AvatarImage src={current?.avatar} alt={current?.name} />
              <AvatarFallback>{current?.name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm">Send back to <span className="font-medium">{current?.name ?? "same employee"}</span></span>
          </label>
          <label className={cn("flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer", mode === "reassign" && "border-primary bg-primary/5")}>
            <RadioGroupItem value="reassign" />
            <span className="text-sm">Reassign to someone else</span>
          </label>
        </RadioGroup>
      </div>

      {mode === "reassign" && (
        <div className="rounded-md border bg-background p-2">
          {newAssignee && (
            <p className="px-1 pb-2 text-xs text-muted-foreground">
              Reassigning to <span className="font-medium text-foreground">{newAssignee.name}</span>
            </p>
          )}
          <AssigneePicker selectedId={newAssignee?.id} excludeId={currentAssigneeId} onSelect={setNewAssignee} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={!canConfirm}
          onClick={() => onConfirm(notes.trim(), mode === "reassign" ? newAssignee?.id : undefined)}
        >
          Confirm revision
        </Button>
      </div>
    </div>
  );
}