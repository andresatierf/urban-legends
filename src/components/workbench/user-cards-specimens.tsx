import { LoggedUserCard } from "@/components/logged-user-card";
import { SectionHeader } from "@/components/section-header";
import { ProfileCard } from "@/components/users/details/profile-card";
import type { UserDetails } from "@/components/users/details/types";

import type { Id } from "../../../convex/_generated/dataModel";

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

export function UserCardsSpecimens() {
  return (
    <div className="space-y-16">
      <ProfileCardSection />
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

function Specimen({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-label-caps">{label}</h3>
      <div className="bg-paper rounded-lg p-6">{children}</div>
    </div>
  );
}
