"use client";

import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  ClipboardList,
  Code2,
  FileCheck,
  FileText,
  Layers,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  PlusCircle,
  Shield,
  TrendingUp,
  Trophy,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
import { InviteMemberFormDialog } from "./form/invite-member-form";
import { UpsertSubmissionFormDialog } from "./form/upsert-submission-form";
import { UpsertTournamentFormDialog } from "./form/upsert-tournament-form";
import { LoggedUserCard } from "./logged-user-card";

type SidebarItem = {
  title: string;
  roles?: string[];
  condition?: (context: { captainedTeamsCount: number }) => boolean;
  publicAccess?: boolean;
  exact?: boolean; // For route matching (exact vs partial)
  badge?: {
    query: FunctionReference<"query">;
    color?: "default" | "destructive" | "secondary" | "outline";
    tooltip?: string;
  };
} & (
  | { items: SidebarItem[] }
  | ({ icon: LucideIcon } & ({ href: string } | { onClick: () => void }))
);

function useSidebarItems(
  setSubmissionFormOpen: (state: boolean) => void,
  setInviteMemberDialogOpen: (state: boolean) => void,
  setCreateTournamentDialogOpen: (state: boolean) => void,
) {
  const t = useTranslations("sidebar.items");
  const tTooltip = useTranslations("sidebar.tooltip");

  const sidebar: SidebarItem[] = useMemo(
    () => [
      // ===== USER SECTION (Always Visible) =====
      {
        title: t("user.group"),
        publicAccess: true,
        items: [
          {
            title: t("user.dashboard"),
            href: "/dashboard",
            icon: LayoutDashboard,
            exact: true,
          },
          {
            title: t("user.tournaments"),
            href: "/tournaments",
            roles: ["player"],
            icon: Trophy,
          },
          {
            title: t("user.teams"),
            href: "/teams",
            roles: ["player"],
            icon: Users,
          },
          {
            title: t("user.submissions"),
            href: "/submissions",
            roles: ["player"],
            icon: ClipboardList,
          },
          {
            title: t("user.newSubmission"),
            roles: ["player"],
            onClick: () => setSubmissionFormOpen(true),
            icon: PlusCircle,
          },
        ],
      },

      // ===== ADMIN SECTION (Conditional: Has 'admin' or 'tournament_manager' role) =====
      {
        title: t("admin.group"),
        roles: ["admin"],
        items: [
          {
            title: t("admin.dashboard"),
            href: "/admin",
            icon: Shield,
            roles: ["admin"], // Admin-only
            exact: true,
          },
          {
            title: t("admin.tournaments"),
            href: "/admin/tournaments",
            icon: Trophy,
            roles: ["admin", "tournament_manager"], // Allow tournament_manager
          },
          {
            title: t("admin.users"),
            href: "/users",
            icon: UserCog,
            roles: ["admin"], // Admin-only
          },
          {
            title: t("admin.submissions"),
            href: "/manage/submissions",
            icon: FileText,
            badge: {
              query: api.role.admin.getAllPendingCount,
              color: "secondary",
            },
            roles: ["admin", "tournament_manager"], // Allow tournament_manager
          },
          {
            title: t("admin.submissionGroups"),
            href: "/admin/submission-groups",
            icon: Layers,
            badge: {
              query: api.submissionGroups.getPendingCount,
              color: "secondary",
            },
            roles: ["admin", "tournament_manager"], // Allow tournament_manager
          },
          {
            title: t("admin.system"),
            href: "/admin/system",
            icon: Activity,
            roles: ["admin"], // Admin-only
          },
        ],
      },

      // ===== TOURNAMENT MANAGER SECTION (Conditional: Has 'tournament_manager' role) =====
      {
        title: t("tournamentManager.group"),
        roles: ["tournament_manager", "admin"], // Admins also have manager access
        items: [
          {
            title: t("tournamentManager.dashboard"),
            href: "/tournament-manager",
            icon: Briefcase,
            exact: true,
          },
          {
            title: t("tournamentManager.tournaments"),
            href: "/tournament-manager/tournaments",
            icon: Calendar,
            condition: () => false,
          },
          {
            title: t("tournamentManager.submissions"),
            href: "/manage/submissions",
            icon: Calendar,
            badge: {
              query: api.role.tournamentManager.getPendingCount,
              color: "secondary",
              tooltip: tTooltip("pendingSubmissions"),
            },
          },
          {
            title: t("tournamentManager.approvals"),
            href: "/tournament-manager/approvals",
            icon: CheckSquare,
            badge: {
              query: api.role.tournamentManager.getPendingCount,
              color: "secondary",
              tooltip: tTooltip("pendingSubmissions"),
            },
            condition: () => false,
          },
          {
            title: t("tournamentManager.analytics"),
            href: "/tournament-manager/analytics",
            icon: LineChart,
            condition: () => false,
          },
          {
            title: t("tournamentManager.createTournament"),
            onClick: () => setCreateTournamentDialogOpen(true),
            icon: PlusCircle,
            condition: () => false,
          },
        ],
      },

      // ===== REVIEWER SECTION (Conditional: Has 'reviewer' role) =====
      {
        title: t("reviewer.group"),
        roles: ["reviewer", "admin"], // Admins also have review access
        items: [
          {
            title: t("reviewer.queue"),
            href: "/reviewer",
            icon: FileCheck,
            badge: {
              query: api.role.reviewer.getPendingCount,
              color: "secondary",
            },
            exact: true,
          },
          {
            title: t("reviewer.statistics"),
            href: "/reviewer/statistics",
            icon: TrendingUp,
          },
        ],
      },

      // ===== CAPTAIN SECTION (Conditional: User Captains Teams) =====
      {
        title: t("captain.group"),
        condition: ({ captainedTeamsCount }) => captainedTeamsCount > 0,
        items: [
          {
            title: t("captain.myTeams"),
            href: "/captain",
            icon: Shield,
            badge: {
              query: api.captain.getPendingActionsCount,
              color: "default",
              tooltip: tTooltip("pendingRequestsAndInvitations"),
            },
            exact: true,
          },
          {
            title: t("captain.comparison"),
            href: "/captain/comparison",
            icon: BarChart3,
          },
          {
            title: t("captain.inviteMember"),
            onClick: () => setInviteMemberDialogOpen(true),
            icon: UserPlus,
          },
        ],
      },

      // ===== VIEWER SECTION (Conditional: Has 'viewer' role OR public access) =====
      {
        title: t("viewer.group"),
        publicAccess: true, // Visible even without login
        items: [
          {
            title: t("viewer.publicLeaderboards"),
            href: "/public/leaderboards",
            icon: Trophy,
            publicAccess: true,
          },
        ],
      },

      // ===== DEV SECTION (Conditional: Has 'dev' role) =====
      {
        title: t("dev.group"),
        roles: ["dev"],
        items: [
          {
            title: t("dev.buttonDemo"),
            href: "/dev/button-demo",
            icon: Code2,
          },
          {
            title: t("dev.cardDemo"),
            href: "/dev/card-demo",
            icon: Layers,
          },
        ],
      },
    ],
    [
      t,
      tTooltip,
      setSubmissionFormOpen,
      setInviteMemberDialogOpen,
      setCreateTournamentDialogOpen,
    ],
  );

  return { items: sidebar };
}

export function AppSidebar() {
  const { user } = useUser({ shouldThrow: false });
  const { isActive } = useActiveRoute();

  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [createTournamentDialogOpen, setCreateTournamentDialogOpen] =
    useState(false);

  // Get captain teams count for conditional rendering
  const captainedTeamsCount = useQuery(api.captain.getCaptainedTeamsCount) ?? 0;

  const { items: sidebarItems } = useSidebarItems(
    setSubmissionFormOpen,
    setInviteMemberDialogOpen,
    setCreateTournamentDialogOpen,
  );

  const context = { captainedTeamsCount };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-10" />
      <SidebarContent>
        {sidebarItems.map((item) =>
          renderItem(item, user, user?.roleNames || [], context, isActive),
        )}
        {user && (
          <>
            <UpsertSubmissionFormDialog
              open={submissionFormOpen}
              onOpenChange={setSubmissionFormOpen}
            />
            <InviteMemberFormDialog
              open={inviteMemberDialogOpen}
              onOpenChange={setInviteMemberDialogOpen}
            />
            <UpsertTournamentFormDialog
              open={createTournamentDialogOpen}
              onOpenChange={setCreateTournamentDialogOpen}
            />
          </>
        )}
      </SidebarContent>
      <SidebarSeparator />
      {user && (
        <SidebarFooter>
          <LoggedUserCard />
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
  // Check role-based visibility
  if (item.roles && !userRoles.some((role) => item.roles?.includes(role))) {
    return null;
  }

  // Check custom condition (e.g., user must captain teams)
  if (item.condition && !item.condition(context)) {
    return null;
  }

  // Check public access (visible even without auth)
  if (!item.publicAccess && !user) {
    return null;
  }

  // Render group
  if ("items" in item) {
    const visibleItems = item.items
      .map((subItem) => renderItem(subItem, user, userRoles, context, isActive))
      .filter(Boolean);

    // Don't render empty groups
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

  // Render button item (onClick)
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

  // Render link item with active state
  const active = isActive(item.href, item.exact);

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={active}>
        <Link href={item.href} aria-current={active ? "page" : undefined}>
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
