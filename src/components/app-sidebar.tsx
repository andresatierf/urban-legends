"use client";

import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  BarChart2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  type LucideIcon,
  PlusCircle,
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
import { Button } from "./ui/button";

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
];

export function Sidebar() {
  const { signOut } = useClerk();

  const user = useQuery(api.users.current);
  const roles = useQuery(
    api.roles.getByUserId,
    user ? { userId: user._id } : "skip",
  );

  return (
    <SidebarBase collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {sidebar.map((item) => renderItem(item, roles || []))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="space-y-2">
        <span className="flex flex-col items-center">
          <p className="badge">
            <span>Logged in{user?.name ? ` as ${user.name}` : ""}</span>
          </p>
        </span>
        <Button onClick={() => signOut()}>Sign Out</Button>
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
