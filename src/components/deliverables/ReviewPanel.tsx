import { useEffect, useState } from "react";
import {
  CheckCircle2, Clapperboard, Palette, FileVideo, FileImage, FileText,
  Download, RotateCcw, Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { RevisionFlow } from "./RevisionFlow";
import {
  clientById, memberById, type Deliverable, type SubmittedFile,
} from "@/data/mockDeliverablesRelay";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FileRow({ file }: { file: SubmittedFile }) {
  const Icon = file.kind === "video" ? FileVideo : file.kind === "image" ? FileImage : FileText;
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5">
      {file.thumb ? (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
          <img src={file.thumb} alt={file.name} className="size-full object-cover" />
          {file.kind === "video" && (
            <div className="absolute inset-0 grid place-items-center bg-black/30">
              <FileVideo className="size-5 text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="grid size-14 shrink-0 place-items-center rounded-md bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{file.name}</div>
        {file.size && <div className="text-xs text-muted-foreground">{file.size}</div>}
      </div>
      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Download ${file.name}`}>
        <Download className="size-4" />
      </Button>
    </div>
  );
}

export function ReviewPanel({
  deliverable,
  open,
  onOpenChange,
  onApprove,
  onRequestRevision,
}: {
  deliverable: Deliverable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onRequestRevision: (notes: string, newAssigneeId?: string) => void;
}) {
  const [revising, setRevising] = useState(false);
  useEffect(() => {
    if (open) setRevising(false);
  }, [open, deliverable?.id]);

  const assignee = memberById(deliverable?.assigneeId);
  const client = deliverable ? clientById(deliverable.clientId) : undefined;
  const TypeIcon = deliverable?.type === "video" ? Clapperboard : Palette;
  const files = deliverable?.files ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {deliverable && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <TypeIcon className="size-4 text-muted-foreground" /> {deliverable.name}
              </SheetTitle>
              <SheetDescription>Review the submitted final work and decide.</SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-5">
              {/* details */}
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Client</dt>
                  <dd className="font-medium">{client?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="font-medium">{deliverable.type === "video" ? "Video" : "Static"}</dd>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Due {fmtDate(deliverable.deadline)}</span>
                </div>
              </dl>

              {/* submitter */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="size-10">
                  <AvatarImage src={assignee?.avatar} alt={assignee?.name} />
                  <AvatarFallback>{assignee?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{assignee?.name}</div>
                  <div className="text-xs text-muted-foreground">{assignee?.role}</div>
                </div>
                {deliverable.revisionCount > 0 && (
                  <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Revision #{deliverable.revisionCount}
                  </span>
                )}
              </div>

              {/* submitted files — the core of the review */}
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Delivered work ({files.length} file{files.length === 1 ? "" : "s"})
                </div>
                <div className="space-y-2">
                  {files.length > 0
                    ? files.map((f) => <FileRow key={f.name} file={f} />)
                    : <p className="text-sm text-muted-foreground">No files attached.</p>}
                </div>
              </div>

              {/* submission note */}
              {deliverable.submissionNote && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Submission note</div>
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">{deliverable.submissionNote}</p>
                </div>
              )}

              {/* actions */}
              {!revising ? (
                <div className="flex flex-col gap-2 pt-2">
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onApprove}>
                    <CheckCircle2 className="size-4" /> Approve — mark complete
                  </Button>
                  <Button variant="outline" onClick={() => setRevising(true)}>
                    <RotateCcw className="size-4" /> Request revision
                  </Button>
                </div>
              ) : (
                <RevisionFlow
                  currentAssigneeId={deliverable.assigneeId}
                  onCancel={() => setRevising(false)}
                  onConfirm={(notes, newId) => onRequestRevision(notes, newId)}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
