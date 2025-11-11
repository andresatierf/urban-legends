"use client";

import { useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { UpsertSubmissionFormDialog } from "@/components/form/upsert-submission-form";
import { SectionHeader } from "@/components/section-header";
import { SubmissionsDataTable } from "@/components/submissions/submissions-data-table";
import { useUser } from "@/hooks/useUser";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export default function Submissions() {
  const { user, isAdmin } = useUser();

  const submissions =
    useQuery(
      api.submissions.list,
      user
        ? { userId: user._id, state: ["approved", "pending", "rejected"] }
        : "skip",
    ) || [];
  const pendingSubmissions =
    useQuery(api.submissions.list, { state: "pending" }) || [];
  const allSubmissions = useQuery(api.submissions.list, {}) || [];

  const teams = useQuery(api.teams.list, {}) || [];
  const teamIdMap = useMemo(() => {
    return teams.reduce<Map<Id<"teams">, Doc<"teams">>>(
      (acc, team) => acc.set(team._id, team),
      new Map(),
    );
  }, [teams]);

  const users = useQuery(api.users.list, {}) || [];
  const userIdMap = useMemo(() => {
    return users.reduce<Map<Id<"users">, Doc<"users">>>(
      (acc, user) => acc.set(user._id, user),
      new Map(),
    );
  }, [users]);

  const augmentSubmissions = useCallback(
    (subs: Doc<"submissions">[]) =>
      subs.map((submission) => ({
        ...submission,
        team: teamIdMap.get(submission.teamId)!,
        user: userIdMap.get(submission.userId)!,
      })),
    [teamIdMap, userIdMap],
  );

  return (
    <>
      <SectionHeader as="h1" title="Submissions">
        <UpsertSubmissionFormDialog />
      </SectionHeader>
      <div className="space-y-6">
        <SubmissionsDataTable
          title="Your Submissions"
          submissions={augmentSubmissions(submissions)}
          showActions
        />
        {isAdmin && (
          <>
            <SubmissionsDataTable
              title="Pending Submissions"
              submissions={augmentSubmissions(pendingSubmissions)}
              showActions
            />
            <SubmissionsDataTable
              title="All Submissions"
              submissions={augmentSubmissions(allSubmissions)}
              showActions
              enableSearch
            />
          </>
        )}

        {/* {teams.length !== 0 ? ( */}
        {/*   selectedTeam && */}
        {/*   selectedTeamData && ( */}
        {/*     <Card> */}
        {/*       <CardHeader> */}
        {/*         <CardTitle>Your Progress Calendar</CardTitle> */}
        {/*         <label */}
        {/*           htmlFor="team-selector" */}
        {/*           className="mb-2 block font-medium text-gray-700 text-sm" */}
        {/*         > */}
        {/*           Select Team */}
        {/*         </label> */}
        {/*         {/** biome-ignore lint/correctness/useUniqueElementIds: id */}
        {/*         <select */}
        {/*           id="team-selector" */}
        {/*           value={selectedTeam || ""} */}
        {/*           onChange={(e) => */}
        {/*             setSelectedTeam((e.target.value as Id<"teams">) || null) */}
        {/*           } */}
        {/*           className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" */}
        {/*         > */}
        {/*           <option value="" disabled> */}
        {/*             Select a team... */}
        {/*           </option> */}
        {/*           {teams.map((team) => ( */}
        {/*             <option key={team._id} value={team._id}> */}
        {/*               {team.name} - {team.tournament?.name} */}
        {/*             </option> */}
        {/*           ))} */}
        {/*         </select> */}
        {/*       </CardHeader> */}
        {/*       <CardContent> */}
        {/*         {selectedTeamData.tournament && ( */}
        {/*           <div className="grid grid-cols-7 gap-2"> */}
        {/*             {generateDateRange( */}
        {/*               selectedTeamData.tournament.startDate, */}
        {/*               selectedTeamData.tournament.endDate, */}
        {/*             ).map((date) => { */}
        {/*               const completion = submissions.find( */}
        {/*                 (c) => c.date === date, */}
        {/*               ); */}
        {/*               const isToday = */}
        {/*                 date === new Date().toISOString().split("T")[0]; */}
        {/**/}
        {/*               return ( */}
        {/*                 <div */}
        {/*                   key={date} */}
        {/*                   className={cn( */}
        {/*                     "rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-600 text-xs", */}
        {/*                     { */}
        {/*                       "border-blue-300 bg-blue-100 text-blue-800": */}
        {/*                         isToday, */}
        {/*                       "border-red-300 bg-red-100 text-red-800": */}
        {/*                         completion?.state === "rejected", */}
        {/*                       "border-yellow-300 bg-yellow-100 text-yellow-800": */}
        {/*                         completion?.state === "pending", */}
        {/*                       "border-green-300 bg-green-100 text-green-800": */}
        {/*                         completion?.state === "approved", */}
        {/*                     }, */}
        {/*                   )} */}
        {/*                 > */}
        {/*                   {new Date(date).getDate()} */}
        {/*                 </div> */}
        {/*               ); */}
        {/*             })} */}
        {/*           </div> */}
        {/*         )} */}
        {/*       </CardContent> */}
        {/*     </Card> */}
        {/*   ) */}
        {/* ) : ( */}
        {/*   <div className="rounded-lg bg-white p-6 text-center shadow"> */}
        {/*     <p className="text-gray-500"> */}
        {/*       You're not part of any active teams. Contact an admin to be added */}
        {/*       to a team. */}
        {/*     </p> */}
        {/*   </div> */}
        {/* )} */}
      </div>
    </>
  );
}
