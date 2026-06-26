import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Paperclip } from "lucide-react";
import { fmtHMShort } from "@/hooks/useTimer";
import type { MyTask } from "@/data/myTasks";
import { myProjects } from "@/data/myTasks";

export function SubmitModal({
  task,
  open,
  onClose,
  onSubmit,
}: {
  task: MyTask | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (note: string, fileNames: string[]) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [note, setNote] = useState("");

  if (!task) return null;
  const project = myProjects.find((p) => p.id === task.projectId);
  const context =
    task.source === "deliverable"
      ? `${task.clientName} · ${task.deliverableName}`
      : task.source === "personal"
        ? "Personal task"
        : project?.name;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).map((f) => f.name);
    setFiles((prev) => [...prev, ...list]);
  };

  const reset = () => { setFiles([]); setNote(""); };
  const close = () => { reset(); onClose(); };
  const submit = () => {
    if (files.length === 0) return;
    onSubmit(note, files);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Submit for Review</DialogTitle>
          <DialogDescription className="text-sm">
            <span className="font-medium text-foreground">{task.title}</span>
            {context && <span className="text-muted-foreground"> · {context}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <input type="file" multiple className="hidden" onChange={handleFiles} id="submit-files" />
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-accent/40 transition-colors">
              <Upload className="size-6 mx-auto text-muted-foreground" />
              <div className="mt-2 text-sm font-medium">Drop files here or click to browse</div>
              <div className="text-xs text-muted-foreground">Any file type accepted</div>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => document.getElementById("submit-files")?.click()}>
                Choose files
              </Button>
            </div>
          </label>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-accent rounded-full pl-2.5 pr-1 py-1">
                  <Paperclip className="size-3" />
                  <span className="max-w-[160px] truncate">{f}</span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="rounded-full hover:bg-background p-0.5">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Note for your reviewer <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea className="mt-1.5" rows={3} placeholder="Anything they should know?" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="text-xs text-muted-foreground">
            Total time logged: <span className="font-mono text-foreground">{fmtHMShort(task.accumulatedMin)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={submit} disabled={files.length === 0}>Submit for Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
