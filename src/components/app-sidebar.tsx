import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Code2,
  LayoutDashboard,
  type LucideIcon,
  PlusCircle,
  Settings,
  Shield,
  Swords,
  TrendingUp,
  Trophy,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { InviteMemberFormDialog } from "@/components/teams/form";
import { UpsertTournamentFormDialog } from "@/components/tournaments/form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBadge } from "@/components/ui/sidebar-badge";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useUser } from "@/hooks/useUser";

import { api } from "../../convex/_generated/api";
import { useActivityDialog } from "./activity-dialog-context";
import { NavUser } from "./nav-user";
import { getHighestRankingRole } from "./users/utils";

type SidebarContext = {
  captainedTeamsCount: number;
  isPlayer: boolean;
  canCreateTournament: boolean;
  managedTournamentsCount: number;
};

const isPlayerCondition = (ctx: SidebarContext) => ctx.isPlayer;

type SidebarItem = {
  title: string;
  roles?: string[];
  condition?: (context: SidebarContext) => boolean;
  publicAccess?: boolean;
  exact?: boolean;
  badge?: {
    query: FunctionReference<"query">;
    color?: "success" | "warning" | "error" | "info" | "social" | "neutral";
    tooltip?: string;
  };
} & (
  | { items: SidebarItem[] }
  | ({ icon: LucideIcon } & ({ href: string } | { onClick: () => void }))
);

function useSidebarItems(
  openActivityDialog: () => void,
  setInviteMemberDialogOpen: (state: boolean) => void,
  setCreateTournamentDialogOpen: (state: boolean) => void,
  managedTournaments: Array<{ _id: string; name: string }>,
) {
  const sidebar: SidebarItem[] = useMemo(
    () => [
      {
        title: "Player",
        publicAccess: true,
        items: [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            exact: true,
          },
          {
            title: "Tournaments",
            href: "/tournaments",
            condition: isPlayerCondition,
            icon: Trophy,
          },
          {
            title: "Teams",
            href: "/teams",
            condition: isPlayerCondition,
            icon: Users,
          },
          {
            title: "My Activities",
            href: "/activities/mine",
            condition: isPlayerCondition,
            icon: ClipboardList,
            exact: true,
          },
          {
            title: "Submit Activity",
            condition: isPlayerCondition,
            onClick: openActivityDialog,
            icon: PlusCircle,
          },
        ],
      },

      {
        title: "Admin",
        roles: ["admin"],
        items: [
          {
            title: "Admin Dashboard",
            href: "/admin",
            icon: Shield,
            roles: ["admin"],
            exact: true,
          },
          {
            title: "Users",
            href: "/users",
            icon: UserCog,
            roles: ["admin"],
          },
          {
            title: "System Health",
            href: "/admin/system",
            icon: Activity,
            roles: ["admin"],
          },
        ],
      },

      {
        title: "Review",
        roles: ["reviewer", "admin"],
        items: [
          {
            title: "Review Activities",
            href: "/activities/review",
            icon: ClipboardCheck,
            badge: {
              query: api.role.reviewer.getPendingCount,
              color: "warning",
              tooltip: "Pending Activities",
            },
          },
          {
            title: "Review Stats",
            href: "/reviewer/statistics",
            icon: TrendingUp,
          },
        ],
      },

      {
        title: "Team Captain",
        condition: ({ captainedTeamsCount }) => captainedTeamsCount > 0,
        items: [
          {
            title: "My Teams",
            href: "/captain",
            icon: Shield,
            badge: {
              query: api.captain.getPendingActionsCount,
              color: "info",
              tooltip: "Pending Requests & Invitations",
            },
            exact: true,
          },
          {
            title: "Team Comparison",
            href: "/captain/comparison",
            icon: BarChart3,
          },
          {
            title: "Invite Member",
            onClick: () => setInviteMemberDialogOpen(true),
            icon: UserPlus,
          },
        ],
      },

      {
        title: "Manage",
        condition: ({ canCreateTournament, managedTournamentsCount }) =>
          canCreateTournament || managedTournamentsCount > 0,
        items: [
          {
            title: "Create Tournament",
            onClick: () => setCreateTournamentDialogOpen(true),
            icon: PlusCircle,
            condition: ({ canCreateTournament }) => canCreateTournament,
          },
          ...managedTournaments.map(
            (t): SidebarItem => ({
              title: t.name,
              href: `/tournaments/${t._id}`,
              icon: Settings,
              exact: true,
            }),
          ),
        ],
      },

      {
        title: "Discover",
        publicAccess: true,
        items: [
          {
            title: "Public Leaderboards",
            href: "/public/leaderboards",
            icon: Trophy,
            publicAccess: true,
          },
        ],
      },

      {
        title: "Developer",
        roles: ["dev"],
        items: [
          {
            title: "Workbench",
            href: "/workbench/primitives/tokens",
            icon: Code2,
          },
        ],
      },
    ],
    [
      openActivityDialog,
      setInviteMemberDialogOpen,
      setCreateTournamentDialogOpen,
      managedTournaments,
    ],
  );

  return { items: sidebar };
}

export function AppSidebar() {
  const { user, canCreateTournament } = useUser({ shouldThrow: false });
  const { isActive } = useActiveRoute();
  const { openActivityDialog } = useActivityDialog();

  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [createTournamentDialogOpen, setCreateTournamentDialogOpen] =
    useState(false);

  const captainedTeamsCount = useQuery(api.captain.getCaptainedTeamsCount) ?? 0;
  const isPlayer = useQuery(api.captain.getIsPlayer) ?? false;
  const managedTournaments = useQuery(
    api.tournaments.listManaged,
    user ? {} : "skip",
  );

  const { items: sidebarItems } = useSidebarItems(
    openActivityDialog,
    setInviteMemberDialogOpen,
    setCreateTournamentDialogOpen,
    managedTournaments ?? [],
  );

  const context: SidebarContext = {
    captainedTeamsCount,
    isPlayer,
    canCreateTournament,
    managedTournamentsCount: managedTournaments?.length ?? 0,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="BoolLegends"
              className="group-data-[collapsible=icon]:p-0!"
            >
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Swords className="size-4" />
                </div>
                <span className="text-body-sm truncate font-semibold">
                  BoolLegends
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarItems.map((item) =>
          renderItem(item, user, user?.roleNames || [], context, isActive),
        )}
        {user && (
          <InviteMemberFormDialog
            open={inviteMemberDialogOpen}
            onOpenChange={setInviteMemberDialogOpen}
          />
        )}
        {canCreateTournament && (
          <UpsertTournamentFormDialog
            open={createTournamentDialogOpen}
            onOpenChange={setCreateTournamentDialogOpen}
          />
        )}
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser
            user={{
              userId: user._id,
              name: user.name,
              email: user.email,
              imageUrl: user.imageUrl,
              roleLabel: getHighestRankingRole(user.roles),
            }}
          />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}

function renderItem(
  item: SidebarItem,
  user: { roleNames: string[] } | null | undefined,
  userRoles: string[],
  context: SidebarContext,
  isActive: (href: string, exact?: boolean) => boolean,
) {
  if (item.roles && !userRoles.some((role) => item.roles?.includes(role))) {
    return null;
  }

  if (item.condition && !item.condition(context)) {
    return null;
  }

  if (!item.publicAccess && !user) {
    return null;
  }

  if ("items" in item) {
    const visibleItems = item.items
      .map((subItem) => renderItem(subItem, user, userRoles, context, isActive))
      .filter(Boolean);

    if (visibleItems.length === 0) return null;

    return (
      <SidebarGroup key={item.title}>
        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{visibleItems}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if ("onClick" in item) {
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
          <item.icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
        {item.badge && <SidebarBadge {...item.badge} />}
      </SidebarMenuItem>
    );
  }

  const active = isActive(item.href, item.exact);

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <Link to={item.href} aria-current={active ? "page" : undefined}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.badge && <SidebarBadge {...item.badge} />}
    </SidebarMenuItem>
  );
}
