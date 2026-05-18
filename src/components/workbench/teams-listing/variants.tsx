import { Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { TournamentSwitcher } from "@/components/common/tournament-switcher";
import { SectionHeader } from "@/components/section-header";
import { TeamCard } from "@/components/teams/card";
import type {
  TeamWithMembers,
  TournamentMap,
} from "@/components/teams/listing/types";
import {
  STATUS_LABEL,
  getTournamentStatus,
} from "@/components/tournaments/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";

const noopActions = {
  joinRequest: null,
  onRequestJoin: async () => {},
  onCancelRequest: () => {},
  onLeave: () => {},
};

const STATUS_ORDER: Record<ReturnType<typeof getTournamentStatus>, number> = {
  active: 0,
  upcoming: 1,
  ended: 2,
};

const STATUS_EYEBROW_COLOR: Record<
  ReturnType<typeof getTournamentStatus>,
  "grass" | "sky" | "mute"
> = {
  active: "grass",
  upcoming: "sky",
  ended: "mute",
};

export type ListingProps = {
  userTeams: TeamWithMembers[];
  allTeams: TeamWithMembers[];
  tournamentMap: TournamentMap;
  currentUserId: Id<"users">;
};

function renderCard(
  team: TeamWithMembers,
  tournamentMap: TournamentMap,
  userTeamIds: Set<string>,
  userTournamentIds: Set<string>,
  currentUserId: Id<"users">,
  showTournamentEyebrow: boolean,
) {
  const isUserMember = userTeamIds.has(team._id);
  const role = isUserMember
    ? (team.members.find((m) => m._id === currentUserId)?.memberRole ?? null)
    : null;
  return (
    <TeamCard
      key={team._id}
      data={{
        team,
        tournament: showTournamentEyebrow
          ? tournamentMap[team.tournamentId]
          : undefined,
        members: team.members,
        memberCount: team.members.length,
        isUserMember,
        isUserInTeam: userTournamentIds.has(team.tournamentId),
        userRole: role,
        rank: team.rank,
        totalTeams: team.totalTeams,
      }}
      {...noopActions}
    />
  );
}

// ─── Variant A · Anchor Lane ────────────────────────────────────────────────
// "Your teams" pinned at top inside a paper-deep band; "Browse" below.

export function VariantAnchorLane({
  userTeams,
  allTeams,
  tournamentMap,
  currentUserId,
}: ListingProps) {
  const userTeamIds = useMemo(
    () => new Set(userTeams.map((t) => t._id)),
    [userTeams],
  );
  const userTournamentIds = useMemo(
    () => new Set(userTeams.map((t) => t.tournamentId)),
    [userTeams],
  );

  const tournaments = useMemo(
    () =>
      Array.from(new Set(allTeams.map((t) => t.tournamentId)))
        .map((id) => tournamentMap[id])
        .filter((t): t is Doc<"tournaments"> => Boolean(t))
        .sort(
          (a, b) =>
            STATUS_ORDER[getTournamentStatus(a)] -
            STATUS_ORDER[getTournamentStatus(b)],
        ),
    [allTeams, tournamentMap],
  );

  const [filter, setFilter] = useState<string>("all");
  const browseTeams = useMemo(
    () =>
      allTeams.filter(
        (t) =>
          !userTeamIds.has(t._id) &&
          (filter === "all" || t.tournamentId === filter),
      ),
    [allTeams, userTeamIds, filter],
  );

  return (
    <div className="space-y-8">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        <Button asChild size="sm">
          <Link to="/tournaments">
            <Trophy />
            Tournaments
          </Link>
        </Button>
      </SectionHeader>

      {userTeams.length > 0 && (
        <section className="border-ink bg-paper-deep relative rounded-2xl border-2 p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <Eyebrow color="sunset">Your roster</Eyebrow>
              <h2 className="text-h2 text-foreground mt-1">
                {userTeams.length === 1 ? "Your team" : "Your teams"}
              </h2>
            </div>
            <Badge variant="success" className="gap-1">
              <Crown className="size-3" />
              {userTeams.length} active
            </Badge>
          </div>
          <div
            className={cn(
              "grid grid-cols-1 gap-3 gap-y-6",
              userTeams.length > 1 && "md:grid-cols-2",
            )}
          >
            {userTeams.map((team) =>
              renderCard(
                team,
                tournamentMap,
                userTeamIds,
                userTournamentIds,
                currentUserId,
                true,
              ),
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Browse</Eyebrow>
            <h2 className="text-h2 text-foreground mt-1">All teams</h2>
          </div>
          {tournaments.length > 1 && (
            <TournamentSwitcher
              tournaments={tournaments}
              selectedTournamentId={filter}
              onSelect={setFilter}
              label="Tournament"
              allOption={{ value: "all", label: "All tournaments" }}
            />
          )}
        </div>
        {browseTeams.length === 0 ? (
          <EmptyNote>No other teams to show in this view.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {browseTeams.map((team) =>
              renderCard(
                team,
                tournamentMap,
                userTeamIds,
                userTournamentIds,
                currentUserId,
                filter === "all",
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Variant B · Tournament Sections (broadsheet) ───────────────────────────

export function VariantTournamentSections({
  userTeams,
  allTeams,
  tournamentMap,
  currentUserId,
}: ListingProps) {
  const userTeamIds = useMemo(
    () => new Set(userTeams.map((t) => t._id)),
    [userTeams],
  );
  const userTournamentIds = useMemo(
    () => new Set(userTeams.map((t) => t.tournamentId)),
    [userTeams],
  );
  const [includeEnded, setIncludeEnded] = useState(false);

  const grouped = useMemo(() => {
    const tournaments = Array.from(new Set(allTeams.map((t) => t.tournamentId)))
      .map((id) => tournamentMap[id])
      .filter((t): t is Doc<"tournaments"> => Boolean(t))
      .filter((t) => includeEnded || getTournamentStatus(t) !== "ended")
      .sort((a, b) => {
        const sa = STATUS_ORDER[getTournamentStatus(a)];
        const sb = STATUS_ORDER[getTournamentStatus(b)];
        if (sa !== sb) return sa - sb;
        return b.startDate.localeCompare(a.startDate);
      });
    return tournaments.map((t) => ({
      tournament: t,
      teams: allTeams
        .filter((team) => team.tournamentId === t._id)
        .sort((a, b) => {
          const aMine = userTeamIds.has(a._id) ? 0 : 1;
          const bMine = userTeamIds.has(b._id) ? 0 : 1;
          return aMine - bMine;
        }),
    }));
  }, [allTeams, tournamentMap, userTeamIds, includeEnded]);

  return (
    <div className="space-y-10">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIncludeEnded((v) => !v)}
        >
          {includeEnded ? "Hide past" : "Show past"}
        </Button>
        <Button asChild size="sm">
          <Link to="/tournaments">
            <Trophy />
            Tournaments
          </Link>
        </Button>
      </SectionHeader>

      {grouped.length === 0 ? (
        <EmptyNote>No tournaments to show.</EmptyNote>
      ) : (
        grouped.map(({ tournament, teams }) => {
          const status = getTournamentStatus(tournament);
          const myCount = teams.filter((t) => userTeamIds.has(t._id)).length;
          return (
            <section key={tournament._id} className="space-y-4">
              <div className="border-ink-soft flex flex-wrap items-end justify-between gap-3 border-b pb-3">
                <div>
                  <Eyebrow color={STATUS_EYEBROW_COLOR[status]}>
                    {STATUS_LABEL[status]} · {teams.length}{" "}
                    {teams.length === 1 ? "team" : "teams"}
                    {myCount > 0 && ` · ${myCount} yours`}
                  </Eyebrow>
                  <h2 className="text-h2 text-foreground mt-1">
                    {tournament.name}
                  </h2>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/tournaments/$tournamentId"
                    params={{ tournamentId: tournament._id }}
                  >
                    View tournament
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                {teams.map((team) =>
                  renderCard(
                    team,
                    tournamentMap,
                    userTeamIds,
                    userTournamentIds,
                    currentUserId,
                    false,
                  ),
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

// ─── Variant C · Standings Lens (compact table) ─────────────────────────────

export function VariantStandingsLens({
  userTeams,
  allTeams,
  tournamentMap,
  currentUserId,
}: ListingProps) {
  const userTeamIds = useMemo(
    () => new Set(userTeams.map((t) => t._id)),
    [userTeams],
  );
  const userTournamentIds = useMemo(
    () => new Set(userTeams.map((t) => t.tournamentId)),
    [userTeams],
  );

  const tournaments = useMemo(
    () =>
      Array.from(new Set(allTeams.map((t) => t.tournamentId)))
        .map((id) => tournamentMap[id])
        .filter((t): t is Doc<"tournaments"> => Boolean(t))
        .sort(
          (a, b) =>
            STATUS_ORDER[getTournamentStatus(a)] -
            STATUS_ORDER[getTournamentStatus(b)],
        ),
    [allTeams, tournamentMap],
  );

  const [filter, setFilter] = useState<string>(
    () => tournaments[0]?._id ?? "all",
  );
  const [lens, setLens] = useState<"cards" | "standings">("standings");

  const visible = useMemo(
    () =>
      allTeams
        .filter((t) => filter === "all" || t.tournamentId === filter)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0)),
    [allTeams, filter],
  );

  return (
    <div className="space-y-6">
      <SectionHeader as="h1" title="Teams" Icon={Users}>
        <div className="border-ink flex rounded-lg border-2 p-0.5">
          <LensButton
            active={lens === "standings"}
            onClick={() => setLens("standings")}
          >
            Standings
          </LensButton>
          <LensButton
            active={lens === "cards"}
            onClick={() => setLens("cards")}
          >
            Cards
          </LensButton>
        </div>
      </SectionHeader>

      <div className="flex flex-wrap items-center gap-2">
        <TournamentSwitcher
          tournaments={tournaments}
          selectedTournamentId={filter}
          onSelect={setFilter}
          label="Tournament"
          allOption={{ value: "all", label: "All tournaments" }}
        />
      </div>

      {lens === "standings" ? (
        <StandingsTable
          teams={visible}
          tournamentMap={tournamentMap}
          userTeamIds={userTeamIds}
          showTournament={filter === "all"}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((team) =>
            renderCard(
              team,
              tournamentMap,
              userTeamIds,
              userTournamentIds,
              currentUserId,
              filter === "all",
            ),
          )}
        </div>
      )}
    </div>
  );
}

function LensButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-label-caps rounded-md px-3 py-1.5 transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-paper-deep",
      )}
    >
      {children}
    </button>
  );
}

function StandingsTable({
  teams,
  tournamentMap,
  userTeamIds,
  showTournament,
}: {
  teams: TeamWithMembers[];
  tournamentMap: TournamentMap;
  userTeamIds: Set<string>;
  showTournament: boolean;
}) {
  return (
    <div className="border-ink bg-card overflow-hidden rounded-xl border-2 shadow-[4px_4px_0_var(--color-shadow)]">
      <table className="w-full">
        <thead className="bg-paper-deep">
          <tr className="text-muted-foreground text-label-caps text-left">
            <th className="w-12 px-4 py-3">#</th>
            <th className="px-4 py-3">Team</th>
            {showTournament && (
              <th className="hidden px-4 py-3 md:table-cell">Tournament</th>
            )}
            <th className="hidden px-4 py-3 sm:table-cell">Captain</th>
            <th className="px-4 py-3 text-right">Members</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const isMine = userTeamIds.has(team._id);
            const captain = team.members.find(
              (m) => m.memberRole === "captain",
            );
            const tournament = tournamentMap[team.tournamentId];
            return (
              <tr
                key={team._id}
                className={cn(
                  "border-ink-soft border-t hover:bg-[color:var(--color-primary)]/[0.06]",
                  isMine && "bg-[color:var(--color-sky)]/[0.08]",
                )}
              >
                <td className="text-metric px-4 py-3">{team.rank ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-semibold">
                      {team.name}
                    </span>
                    {isMine && (
                      <Badge variant="info" className="gap-1">
                        <Crown className="size-3" />
                        Yours
                      </Badge>
                    )}
                  </div>
                </td>
                {showTournament && (
                  <td className="text-muted-foreground text-body-sm hidden px-4 py-3 md:table-cell">
                    {tournament?.name ?? "—"}
                  </td>
                )}
                <td className="text-muted-foreground text-body-sm hidden px-4 py-3 sm:table-cell">
                  {captain?.name ?? "—"}
                </td>
                <td className="text-foreground text-body-sm px-4 py-3 text-right">
                  {team.members.length}
                </td>
                <td className="text-metric px-4 py-3 text-right">
                  {team.points ?? 0}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: team._id }}
                    className="text-primary hover:underline"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-ink-soft text-muted-foreground text-body-sm rounded-lg border-2 border-dashed py-8 text-center">
      {children}
    </p>
  );
}
