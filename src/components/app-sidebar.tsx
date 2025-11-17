"use client";

import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  ClipboardList,
  Eye,
  FileCheck,
  FileText,
  Flag,
  Layers,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  PlusCircle,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Tv,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
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
import { useUser } from "@/hooks/useUser";
import { UpsertSubmissionFormDialog } from "./form/upsert-submission-form";
import { LoggedUserCard } from "./logged-user-card";
import { api } from "../../convex/_generated/api";

type SidebarItem = {
  title: string;
  roles?: string[]; // User must have at least one of these roles
  requiredCondition?: (captainCount: number) => boolean; // Custom condition function
  publicAccess?: boolean; // Visible without authentication
  badge?: {
    query: string; // Convex query to fetch badge count
    color?: "default" | "destructive" | "secondary" | "outline";
  };
} & (
  | { items: SidebarItem[] } // Group with sub-items
  | ({ icon: LucideIcon } & ({ href: string } | { onClick: () => void }))
);

function useSidebarItems(
  setSubmissionFormOpen: (state: boolean) => void,
  setInviteMemberDialogOpen: (state: boolean) => void,
  setCreateTournamentDialogOpen: (state: boolean) => void,
) {
  const tUserItems = useTranslations("sidebar.items.user");
  const tCaptainItems = useTranslations("sidebar.items.captain");
  const tReviewerItems = useTranslations("sidebar.items.reviewer");
  const tManagerItems = useTranslations("sidebar.items.tournamentManager");
  const tAdminItems = useTranslations("sidebar.items.admin");
  const tViewerItems = useTranslations("sidebar.items.viewer");

  const sidebar: SidebarItem[] = useMemo(
    () => [
      // ===== USER SECTION (Always Visible) =====
      {
        title: tUserItems("group"),
        items: [
          {
            title: tUserItems("dashboard"),
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: tUserItems("tournaments"),
            href: "/tournaments",
            icon: Trophy,
          },
          {
            title: tUserItems("teams"),
            href: "/teams",
            icon: Users,
          },
          {
            title: tUserItems("submissions"),
            href: "/submissions",
            icon: ClipboardList,
          },
          {
            title: tUserItems("newSubmission"),
            onClick: () => setSubmissionFormOpen(true),
            icon: PlusCircle,
          },
        ],
      },

      // ===== CAPTAIN SECTION (Conditional: User Captains Teams) =====
      {
        title: tCaptainItems("group"),
        requiredCondition: (count) => count > 0,
        items: [
          {
            title: tCaptainItems("myTeams"),
            href: "/captain",
            icon: Shield,
            badge: {
              query: "captain.getPendingActionsCount",
              color: "default",
            },
          },
          {
            title: tCaptainItems("comparison"),
            href: "/captain/comparison",
            icon: BarChart3,
          },
          {
            title: tCaptainItems("inviteMember"),
            onClick: () => setInviteMemberDialogOpen(true),
            icon: UserPlus,
          },
        ],
      },

      // ===== REVIEWER SECTION (Conditional: Has 'reviewer' role) =====
      {
        title: tReviewerItems("group"),
        roles: ["reviewer", "admin"], // Admins also have review access
        items: [
          {
            title: tReviewerItems("queue"),
            href: "/reviewer",
            icon: FileCheck,
            badge: {
              query: "reviewer.getPendingCount",
              color: "secondary",
            },
          },
          {
            title: tReviewerItems("statistics"),
            href: "/reviewer/statistics",
            icon: TrendingUp,
          },
          {
            title: tReviewerItems("flagged"),
            href: "/reviewer/flagged",
            icon: Flag,
            badge: {
              query: "reviewer.getFlaggedCount",
              color: "destructive",
            },
          },
        ],
      },

      // ===== TOURNAMENT MANAGER SECTION (Conditional: Has 'tournament_manager' role) =====
      {
        title: tManagerItems("group"),
        roles: ["tournament_manager", "admin"], // Admins also have manager access
        items: [
          {
            title: tManagerItems("dashboard"),
            href: "/tournament-manager",
            icon: Briefcase,
            badge: {
              query: "tournamentManager.getPendingCount",
              color: "secondary",
            },
          },
          {
            title: tManagerItems("tournaments"),
            href: "/tournament-manager/tournaments",
            icon: Calendar,
          },
          {
            title: tManagerItems("approvals"),
            href: "/tournament-manager/approvals",
            icon: CheckSquare,
            badge: {
              query: "tournamentManager.getPendingCount",
              color: "secondary",
            },
          },
          {
            title: tManagerItems("analytics"),
            href: "/tournament-manager/analytics",
            icon: LineChart,
          },
          {
            title: tManagerItems("createTournament"),
            onClick: () => setCreateTournamentDialogOpen(true),
            icon: PlusCircle,
          },
        ],
      },

      // ===== ADMIN SECTION (Conditional: Has 'admin' role) =====
      {
        title: tAdminItems("group"),
        roles: ["admin"],
        items: [
          {
            title: tAdminItems("dashboard"),
            href: "/admin",
            icon: Shield,
          },
          {
            title: tAdminItems("tournaments"),
            href: "/admin/tournaments",
            icon: Trophy,
          },
          {
            title: tAdminItems("users"),
            href: "/users",
            icon: UserCog,
          },
          {
            title: tAdminItems("submissions"),
            href: "/admin/submissions",
            icon: FileText,
            badge: {
              query: "admin.getAllPendingCount",
              color: "secondary",
            },
          },
          {
            title: tAdminItems("submissionGroups"),
            href: "/admin/submission-groups",
            icon: Layers,
            badge: {
              query: "submissionGroups.getPendingCount",
              color: "secondary",
            },
          },
          {
            title: tAdminItems("system"),
            href: "/admin/system",
            icon: Activity,
          },
        ],
      },

      // ===== VIEWER SECTION (Conditional: Has 'viewer' role OR public access) =====
      {
        title: tViewerItems("group"),
        publicAccess: true, // Visible even without login
        items: [
          {
            title: tViewerItems("publicLeaderboards"),
            href: "/public/leaderboards",
            icon: Trophy,
            publicAccess: true,
          },
          {
            title: tViewerItems("live"),
            href: "/public/live",
            icon: Tv,
            publicAccess: true,
          },
          // Authenticated viewer-only items
          {
            title: tViewerItems("dashboard"),
            href: "/viewer",
            icon: Eye,
            roles: ["viewer"],
          },
          {
            title: tViewerItems("favorites"),
            href: "/viewer/favorites",
            icon: Star,
            roles: ["viewer"],
          },
        ],
      },
    ],
    [
      tUserItems,
      tCaptainItems,
      tReviewerItems,
      tManagerItems,
      tAdminItems,
      tViewerItems,
      setSubmissionFormOpen,
      setInviteMemberDialogOpen,
      setCreateTournamentDialogOpen,
    ],
  );

  return { items: sidebar };
}

export function AppSidebar() {
  const { user } = useUser();

  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [createTournamentDialogOpen, setCreateTournamentDialogOpen] =
    useState(false);

  // Get captain teams count for conditional rendering
  const captainedTeamsCount = useQuery(api.users.getCaptainedTeamsCount) ?? 0;

  const { items: sidebarItems } = useSidebarItems(
    setSubmissionFormOpen,
    setInviteMemberDialogOpen,
    setCreateTournamentDialogOpen,
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-10" />
      <SidebarContent>
        {sidebarItems.map((item) =>
          renderItem(
            item,
            user,
            user?.roleNames || [],
            captainedTeamsCount,
          ),
        )}
        <UpsertSubmissionFormDialog
          open={submissionFormOpen}
          onOpenChange={setSubmissionFormOpen}
        />
        {/* TODO: Add InviteMemberDialog when available */}
        {/* TODO: Add CreateTournamentDialog when available */}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="">
        <LoggedUserCard />
      </SidebarFooter>
    </Sidebar>
  );
}

function renderItem(
  item: SidebarItem,
  user: { roleNames: string[] } | null | undefined,
  userRoles: string[],
  captainedTeamsCount: number,
) {
  // Check role-based visibility
  if (item.roles && !userRoles.some((role) => item.roles?.includes(role))) {
    return null;
  }

  // Check custom condition (e.g., user must captain teams)
  if (item.requiredCondition && !item.requiredCondition(captainedTeamsCount)) {
    return null;
  }

  // Check public access (visible even without auth)
  if (!item.publicAccess && !user) {
    return null;
  }

  // Render group
  if ("items" in item) {
    const visibleItems = item.items
      .map((subItem) =>
        renderItem(subItem, user, userRoles, captainedTeamsCount),
      )
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
            <SidebarBadge query={item.badge.query} color={item.badge.color} />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Render link item
  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <Link href={item.href}>
          <item.icon />
          <span>{item.title}</span>
          {item.badge && (
            <SidebarBadge query={item.badge.query} color={item.badge.color} />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
