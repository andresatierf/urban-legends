import { Trash2, Wrench } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemActionsPanelViewProps {
  isCheckingIntegrity: boolean;
  isCleaningUp: boolean;
  onIntegrityCheck: () => void;
  onCleanup: () => void;
}

export function SystemActionsPanelView({
  isCheckingIntegrity,
  isCleaningUp,
  onIntegrityCheck,
  onCleanup,
}: SystemActionsPanelViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onIntegrityCheck}
          disabled={isCheckingIntegrity}
        >
          <Wrench className="mr-2 h-4 w-4" />
          {isCheckingIntegrity ? "Running..." : "Run Data Integrity Check"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={isCleaningUp}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isCleaningUp ? "Cleaning..." : "Cleanup Orphaned Records"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all orphaned records. This action
              cannot be undone.
            </AlertDialogDescription>
            <AlertDialogAction onClick={onCleanup}>Delete</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
