"use client";

import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  PlusCircle,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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

function useSidebarItems() {
  const tUserItems = useTranslations("sidebar.items.user");
  const tAdminItems = useTranslations("sidebar.items.admin");

  const sidebar: SidebarItem[] = useMemo(
    () => [
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
          { title: tUserItems("teams"), href: "/teams", icon: Users },
          {
            title: tUserItems("submissions"),
            href: "/submissions",
            icon: ClipboardList,
          },
          {
            title: tUserItems("newSubmission"),
            href: "/submissions/new",
            icon: PlusCircle,
          },
        ],
      },
      {
        title: tAdminItems("group"),
        roles: ["admin"],
        items: [
          { title: tAdminItems("dashboard"), href: "/admin", icon: LayoutGrid },
          {
            title: tAdminItems("submissions"),
            href: "/admin/submissions",
            icon: CheckSquare,
          },
          { title: tAdminItems("users"), icon: UserCog, href: "/admin/users" },
        ],
      },
    ],
    [tUserItems, tAdminItems],
  );

  return sidebar;
}

export function Sidebar() {
  const t = useTranslations("sidebar");
  const { signOut } = useClerk();

  const sidebarItems = useSidebarItems();
  const user = useQuery(api.users.current);
  const roles = useQuery(
    api.roles.getByUserId,
    user ? { userId: user._id } : "skip",
  );

  return (
    <SidebarBase collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {sidebarItems.map((item) => renderItem(item, roles || []))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="space-y-2">
        <span className="flex flex-col items-center">
          <p className="badge">
            {user?.name
              ? t("user.loggedInAs", { name: user.name })
              : t("user.loggedIn")}
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
