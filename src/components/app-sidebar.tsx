"use client";

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
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "./sign-out-button";

type SidebarItem = {
  title: string;
  roles?: string[];
} & ({ items: SidebarItem[] } | { href: string; icon: LucideIcon });

const sidebar: SidebarItem[] = [
  {
    title: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "My Tournaments", href: "/tournaments", icon: Trophy },
      { title: "My Teams", href: "/teams", icon: Users },
      { title: "Submissions", href: "/submissions", icon: ClipboardList },
      { title: "Submit Activity", href: "/submissions/new", icon: PlusCircle },
    ],
  },
  {
    title: "Insights",
    roles: ["none"],
    items: [
      {
        title: "Leaderboards",
        href: "/tournaments/:tournamentSlug/leaderboard",
        icon: BarChart2,
      },
    ],
  },
  {
    title: "Admin",
    roles: ["admin"],
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutGrid },
      { title: "Submissions", href: "/admin/submissions", icon: CheckSquare },
      { title: "Tournaments", href: "/admin/tournaments", icon: Trophy },
      { title: "Teams", href: "/admin/teams", icon: Users },
      { title: "Users", icon: UserCog, href: "/admin/users" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", href: "/profile", icon: UserCircle },
      { title: "Sign Out", href: "#", icon: LogOut },
    ],
  },
];

export function Sidebar() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const { isAuthenticated } = useConvexAuth();

  // useEffect(() => {
  //   if (!isAuthenticated) redirect("/login");
  // }, [isAuthenticated]);

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
          <span className="text-gray-600 text-sm">Logged in as</span>
          <span className="text-gray-600 text-sm">
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

  if ("items" in item)
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

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <Link href={item.href}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
