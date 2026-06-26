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

export function LaunchConfirmDialog({
  open,
  onOpenChange,
  projectName,
  taskCount,
  teammateCount,
  firstStage,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectName: string;
  taskCount: number;
  teammateCount: number;
  firstStage: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Launch &lsquo;{projectName}&rsquo;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                This will assign {taskCount} tasks to {teammateCount} teammate{teammateCount !== 1 ? "s" : ""} and start the project timeline. Assignees will receive notifications immediately.
              </p>
              <p>
                Tasks for the first stage (<span className="font-medium text-foreground">{firstStage}</span>) will become active. Later stages remain locked until their dependencies complete.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Launch Project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
