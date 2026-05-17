import { LoggedUserCard } from "@/components/logged-user-card";
import { SectionHeader } from "@/components/section-header";
import { ProfileCard } from "@/components/users/details/profile-card";
import type { UserDetails } from "@/components/users/details/types";
import { RolesBadgeListView } from "@/components/users/roles-badge-list";
import type { ResolvedRole } from "@/components/users/types";

import type { Id } from "../../../convex/_generated/dataModel";
import { Specimen } from "./shells/specimen";

type ProfileVariant = {
  label: string;
  data: UserDetails;
};

function makeUser(
  overrides: Partial<UserDetails["user"]>,
): UserDetails["user"] {
  return {
    _id: "demo-user-1" as Id<"users">,
    _creationTime: 0,
    name: "Andrea Silva",
    email: "andrea@urbanlegends.dev",
    externalId: "clerk_demo_1",
    imageUrl: "",
    roleNames: [],
    roles: [],
    ...overrides,
  } as UserDetails["user"];
}

function makeProfile(overrides: Partial<UserDetails>): UserDetails {
  return {
    user: makeUser({}),
    statistics: {
      teamCount: 2,
      submissionCount: 18,
      approvedSubmissionCount: 14,
      totalPointsEarned: 320,
    },
    teams: [],
    canManageRoles: false,
    isViewingSelf: false,
    ...overrides,
  } as UserDetails;
}

const PROFILE_VARIANTS: ProfileVariant[] = [
  {
    label: "Reviewer · with points",
    data: makeProfile({
      user: makeUser({ roleNames: ["reviewer"] }),
    }),
  },
  {
    label: "No roles · zero points (no ribbon)",
    data: makeProfile({
      statistics: {
        teamCount: 0,
        submissionCount: 0,
        approvedSubmissionCount: 0,
        totalPointsEarned: 0,
      },
    }),
  },
  {
    label: "Admin + reviewer (multi-role)",
    data: makeProfile({
      user: makeUser({
        name: "Captain Booldozer with a very long display name",
        email: "captain.booldozer@a-very-long-email-address.example.com",
        roleNames: ["admin", "reviewer", "tournament_manager"],
      }),
      statistics: {
        teamCount: 4,
        submissionCount: 92,
        approvedSubmissionCount: 80,
        totalPointsEarned: 1240,
      },
    }),
  },
  {
    label: "No roles",
    data: makeProfile({
      user: makeUser({
        name: "Newcomer",
        email: "new@urbanlegends.dev",
        roleNames: [],
      }),
      statistics: {
        teamCount: 0,
        submissionCount: 0,
        approvedSubmissionCount: 0,
        totalPointsEarned: 0,
      },
    }),
  },
];

const ROLE_LIBRARY: Record<string, ResolvedRole> = {
  admin: { name: "admin", displayName: "Admin", hierarchy: 1 },
  tournament_manager: {
    name: "tournament_manager",
    displayName: "Tournament Manager",
    hierarchy: 2,
  },
  reviewer: { name: "reviewer", displayName: "Reviewer", hierarchy: 3 },
  player: { name: "player", displayName: "Player", hierarchy: 4 },
  viewer: { name: "viewer", displayName: "Viewer", hierarchy: 5 },
};

function resolve(...names: Array<keyof typeof ROLE_LIBRARY>): ResolvedRole[] {
  return names.map((n) => ROLE_LIBRARY[n]);
}

const ROLES_BADGE_VARIANTS: Array<{
  label: string;
  resolvedRoles: ResolvedRole[];
  editable?: boolean;
}> = [
  { label: "Empty", resolvedRoles: [] },
  { label: "Single role · read-only", resolvedRoles: resolve("reviewer") },
  {
    label: "Multi-role · read-only (sorted by hierarchy)",
    resolvedRoles: resolve("reviewer", "admin", "tournament_manager"),
  },
  {
    label: "All roles · read-only",
    resolvedRoles: resolve(
      "admin",
      "tournament_manager",
      "reviewer",
      "player",
      "viewer",
    ),
  },
  {
    label: "Single role · editable",
    resolvedRoles: resolve("reviewer"),
    editable: true,
  },
  {
    label: "Multi-role · editable",
    resolvedRoles: resolve("admin", "reviewer", "player"),
    editable: true,
  },
];

export function UserCardsSpecimens() {
  return (
    <div className="space-y-16">
      <ProfileCardSection />
      <RolesBadgeListSection />
      <LoggedUserCardSection />
    </div>
  );
}

function ProfileCardSection() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h1"
        title="Profile Card"
        description="The user details profile card (avatar, ribbon, name, email, roles) across role and points permutations."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {PROFILE_VARIANTS.map((v) => (
          <Specimen key={v.label} label={v.label}>
            <ProfileCard data={v.data} />
          </Specimen>
        ))}
      </div>
    </section>
  );
}

function RolesBadgeListSection() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h2"
        title="Roles Badge List"
        description="Presentational view that renders pre-resolved roles as badges, sorted by hierarchy. The container resolves role names via Convex; the workbench fixtures the resolved entries directly."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {ROLES_BADGE_VARIANTS.map((v) => (
          <Specimen key={v.label} label={v.label}>
            <RolesBadgeListView
              resolvedRoles={v.resolvedRoles}
              editable={v.editable}
              onRemove={v.editable ? () => undefined : undefined}
            />
          </Specimen>
        ))}
      </div>
    </section>
  );
}

function LoggedUserCardSection() {
  return (
    <section className="space-y-6">
      <SectionHeader
        as="h2"
        title="Logged User Card"
        description="Sidebar identity card. Renders the signed-in user from Convex; the expanded/collapsed forms are driven by the surrounding SidebarProvider."
      />
      <p className="text-body-sm text-muted-foreground">
        Binds to the signed-in user via <code>useUser()</code>; cannot be
        fixtured today. Rendered here against the live session.
      </p>
      <div className="bg-paper max-w-sm rounded-lg p-6">
        <LoggedUserCard />
      </div>
    </section>
  );
}
