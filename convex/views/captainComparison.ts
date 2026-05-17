import { query } from "../_generated/server";
import { enrichWithRelations } from "../lib/helpers";
import { getCurrentUserOrThrow } from "../users";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const captainedTeamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "captain"))
      .collect();

    const teamIds = captainedTeamMembers.map((tm) => tm.teamId);

    if (teamIds.length === 0) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .filter((q) => q.or(...teamIds.map((id) => q.eq(q.field("_id"), id))))
      .collect();

    const enrichedTeams = await enrichWithRelations(ctx, teams, {
      tournament: {
        table: "tournaments",
        foreignKey: (team) => team.tournamentId,
      },
      members: { table: "teamMembers", foreignKeyField: "teamId" },
      submissions: { table: "submissions", foreignKeyField: "teamId" },
    });

    const tournamentIds = Array.from(new Set(teams.map((t) => t.tournamentId)));
    const tournaments = await ctx.db
      .query("tournaments")
      .filter((q) =>
        q.or(...tournamentIds.map((id) => q.eq(q.field("_id"), id))),
      )
      .collect();

    const enrichedTournaments = await enrichWithRelations(ctx, tournaments, {
      teams: { table: "teams", foreignKeyField: "tournamentId" },
    });

    const teamsByTournamentId = new Map(
      enrichedTournaments.map((t) => [t._id, t.teams]),
    );

    return enrichedTeams.map((enrichedTeam) => {
      const approvedSubmissions = enrichedTeam.submissions.filter(
        (s) => s.state === "approved",
      );
      const pendingSubmissions = enrichedTeam.submissions.filter(
        (s) => s.state === "pending",
      );

      const totalReviewed =
        approvedSubmissions.length +
        enrichedTeam.submissions.filter((s) => s.state === "rejected").length;
      const approvalRate =
        totalReviewed > 0
          ? Math.round((approvedSubmissions.length / totalReviewed) * 100)
          : 0;

      const allTeamsInTournament =
        teamsByTournamentId.get(enrichedTeam.tournamentId) || [];

      const rank =
        allTeamsInTournament.filter((t) => t.points > enrichedTeam.points)
          .length + 1;

      const { tournament, members, submissions, ...team } = enrichedTeam;

      return {
        team,
        tournament,
        membersCount: members.length,
        totalSubmissions: submissions.length,
        approvedSubmissions: approvedSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        approvalRate,
        points: team.points,
        rank,
        totalTeamsInTournament: allTeamsInTournament.length,
      };
    });
  },
});
