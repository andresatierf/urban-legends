import { useMutation } from "convex/react";
import { Check, Clock, Users, X } from "lucide-react";
import { useState } from "react";

import { EvidenceUploader } from "@/components/activities/evidence-uploader";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/components/users/utils";
import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import { Image } from "../../ui/image";
import type { ActivityDetailsData } from "./types";

type Props = {
  data: ActivityDetailsData;
};

export function SubmitEvidenceCard({ data }: Props) {
  const { activity, roster, viewerParticipation } = data;
  const [uploaderKey, setUploaderKey] = useState(0);
  const [pendingEvidence, setPendingEvidence] = useState<Id<"_storage">[]>([]);
  const submitEvidence = useMutation(api.activities.submitEvidence);

  const viewerRosterEntry = viewerParticipation
    ? roster.find((r) => r.participation._id === viewerParticipation._id)
    : undefined;
  const viewerFulfilled = viewerRosterEntry?.fulfilled ?? false;

  if (!data.canSubmitEvidence || viewerFulfilled) return null;

  const handleSubmit = () => {
    if (pendingEvidence.length === 0) return;
    void tryMutate({
      fn: () =>
        submitEvidence({
          activityId: activity._id,
          evidenceStorageIds: pendingEvidence,
        }),
      onSuccess: () => {
        setPendingEvidence([]);
        setUploaderKey((k) => k + 1);
      },
      successToast: "Evidence uploaded",
      defaultFailureToast: "Failed to upload evidence",
    });
  };

  const helper =
    activity.type === "group"
      ? "You were declared as a participant. Upload 1–5 photos to fulfil your Participation."
      : "This Activity is awaiting Evidence. Upload 1–5 photos to complete it.";

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="text-sm font-medium">Upload your evidence</div>
        <div className="text-muted-foreground text-xs">{helper}</div>
        <EvidenceUploader
          key={uploaderKey}
          storageIds={pendingEvidence}
          onStorageIdsChange={setPendingEvidence}
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={pendingEvidence.length === 0}
        >
          Submit evidence
        </Button>
      </CardContent>
    </Card>
  );
}

export function ParticipationRoster({ data }: Props) {
  const { activity, roster } = data;
  const canRemove = data.canRemoveParticipant;
  const removeParticipantMutation = useMutation(
    api.activities.removeParticipant,
  );

  const handleRemove = (userId: Id<"users">) => {
    void tryMutate({
      fn: () =>
        removeParticipantMutation({
          activityId: activity._id,
          userId,
        }),
      successToast: "Participant removed",
      defaultFailureToast: "Failed to remove participant",
    });
  };

  return (
    <>
      <SectionHeader as="h2" title="Roster" Icon={Users} />
      <SubmitEvidenceCard data={data} />
      <div className="space-y-3">
        {roster.map((entry) => {
          const p = entry.participation;
          const isCreator = p.userId === activity.createdBy;
          const canRemoveThis = canRemove && !isCreator;
          return (
            <Card key={p._id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={entry.user?.imageUrl} />
                    <AvatarFallback>
                      {getInitials(entry.user?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {entry.user?.name ?? entry.user?.email ?? "Unknown"}
                      </p>
                      {isCreator && (
                        <Badge variant="neutral" className="text-xs">
                          Creator
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {entry.user?.email}
                    </p>
                  </div>
                  {entry.fulfilled ? (
                    <Badge
                      variant="success"
                      className="flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Fulfilled
                    </Badge>
                  ) : (
                    <Badge
                      variant="warning"
                      className="flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      Awaiting
                    </Badge>
                  )}
                  {canRemoveThis && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(p.userId)}
                      title="Remove from roster"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {entry.fulfilled && entry.evidence.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {entry.evidence.map((img, idx) => (
                      <div
                        key={img._id}
                        className="overflow-hidden rounded-md border"
                      >
                        <Image
                          src={img.url}
                          alt={img.filename ?? `Evidence ${idx + 1}`}
                          width={200}
                          height={150}
                          className="aspect-video w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
