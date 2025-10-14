"use client";

import {
  Sidebar as SidebarBase,
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
import { useConvexAuth, useQuery } from "convex/react";
import {
  BarChart2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Coins,
  FileChartLine,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  type LucideIcon,
  PlusCircle,
  Settings,
  Trophy,
  UserCircle,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "./sign-out-button";

type SidebarItem = {
  title: string;
  roles?: string[];
} & (
  | {
      items: SidebarItem[];
    }
  | {
      url: string;
      icon: LucideIcon;
    }
);

const sidebar: SidebarItem[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "My Tournaments", url: "/tournaments", icon: Trophy },
      {
        title: "My Teams",
        url: "/tournaments/:tournamentSlug/teams/:teamSlug",
        icon: Users,
      },
      { title: "Submissions", url: "/submissions", icon: ClipboardList },
      {
        title: "Submit Activity",
        url: "/tournaments/:tournamentSlug/submissions/new",
        icon: PlusCircle,
      },
    ],
  },
  {
    title: "Insights",
    roles: ["dev"],
    items: [
      {
        title: "Leaderboards",
        url: "/tournaments/:tournamentSlug/leaderboard",
        icon: BarChart2,
      },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/profile", icon: UserCircle },
      { title: "Sign Out", url: "#", icon: LogOut },
    ],
  },
  {
    title: "Admin",
    roles: ["admin"],
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutGrid },
      { title: "Approvals", url: "/admin/approvals", icon: CheckSquare },
      { title: "Manage Tournaments", url: "/admin/tournaments", icon: Trophy },
      {
        title: "Activity Types",
        url: "/admin/activity-types",
        icon: ClipboardCheck,
      },
      { title: "Users", icon: UserCog, url: "/admin/users" },
      { title: "Points Ledger", icon: Coins, url: "/admin/ledger" },
      { title: "Reports", icon: FileChartLine, url: "/admin/reports" },
      { title: "Settings", icon: Settings, url: "/admin/settings" },
    ],
  },
];

export function Sidebar() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) redirect("/auth/login");
  }, [isAuthenticated]);

  const isAdmin = loggedInUser?.roles.includes("admin") || false;

  return (
    <SidebarBase collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {sidebar.map((item) => renderItem(item, loggedInUser?.roles || []))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="space-y-2">
        <span className="flex flex-col items-center">
          <span className="text-sm text-gray-600">Logged in as</span>
          <span className="text-sm text-gray-600">
            {loggedInUser?.email} {isAdmin && "(Admin)"}
          </span>
        </span>
        <SignOutButton className="w-full" />
      </SidebarFooter>
    </SidebarBase>
  );
}

function renderItem(item: SidebarItem, userRoles: string[]) {
  if (item?.roles && !userRoles.some((role) => item?.roles?.includes(role))) {
    return;
  }

  if (!("items" in item))
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <Link href={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

  return (
    <SidebarGroup key={item.title}>
      <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {item.items.map((subItem) => renderItem(subItem, userRoles))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
