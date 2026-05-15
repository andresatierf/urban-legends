import { useMutation } from "convex/react";

import { tryMutate } from "@/lib/utils";

import { api } from "../../../../convex/_generated/api";
import { TeamCard } from "./layout";
import type { TeamCardData } from "./types";

export function TeamCardContainer({ data }: { data: TeamCardData }) {
  const leaveTeam = useMutation(api.teams.leaveTeam);

  const handleLeave = () => {
    void tryMutate({
      fn: () => leaveTeam({ teamId: data.team._id }),
      successToast: "Successfully left the team",
      defaultFailureToast: "Failed to leave team",
    });
  };

  return <TeamCard data={data} onLeave={handleLeave} />;
}
