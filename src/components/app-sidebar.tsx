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
  Shield,
  TrendingUp,
  Trophy,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { InviteMemberFormDialog } from "@/components/teams/form";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarBadge } from "@/components/ui/sidebar-badge";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useUser } from "@/hooks/useUser";

import { api } from "../../convex/_generated/api";
import { useActivityDialog } from "./activity-dialog-context";
import { NavUser } from "./nav-user";
import { getHighestRankingRole } from "./users/utils";

type SidebarItem = {
  title: string;
  roles?: string[];
  condition?: (context: { captainedTeamsCount: number }) => boolean;
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
            roles: ["player"],
            icon: Trophy,
          },
          {
            title: "Teams",
            href: "/teams",
            roles: ["player"],
            icon: Users,
          },
          {
            title: "My Activities",
            href: "/activities/mine",
            roles: ["player"],
            icon: ClipboardList,
            exact: true,
          },
          {
            title: "Submit Activity",
            roles: ["player"],
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
    [openActivityDialog, setInviteMemberDialogOpen],
  );

  return { items: sidebar };
}

export function AppSidebar() {
  const { user } = useUser({ shouldThrow: false });
  const { isActive } = useActiveRoute();
  const { openActivityDialog } = useActivityDialog();

  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);

  const captainedTeamsCount = useQuery(api.captain.getCaptainedTeamsCount) ?? 0;

  const { items: sidebarItems } = useSidebarItems(
    openActivityDialog,
    setInviteMemberDialogOpen,
  );

  const context = { captainedTeamsCount };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-10" />
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
      </SidebarContent>
      <SidebarSeparator />
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
    </Sidebar>
  );
}

function renderItem(
  item: SidebarItem,
  user: { roleNames: string[] } | null | undefined,
  userRoles: string[],
  context: { captainedTeamsCount: number },
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
        <SidebarMenuButton onClick={item.onClick}>
          <item.icon />
          {item.title}
          {item.badge && (
            <SidebarBadge
              query={item.badge.query}
              color={item.badge.color}
              tooltip={item.badge.tooltip}
            />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const active = isActive(item.href, item.exact);

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={active}>
        <Link to={item.href} aria-current={active ? "page" : undefined}>
          <item.icon />
          <span>{item.title}</span>
          {item.badge && (
            <SidebarBadge
              query={item.badge.query}
              color={item.badge.color}
              tooltip={item.badge.tooltip}
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
