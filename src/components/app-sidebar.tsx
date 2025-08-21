"use client";

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
import { Calendar, Home, Inbox, LucideIcon, Search } from "lucide-react";
import { SignOutButton } from "./sign-out-button";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";

type SidebarItem = {
  title: string;
  role: "admin" | "user";
} & (
  | {
      type: "group";
      items: SidebarItem[];
    }
  | {
      type: "item";
      url: string;
      icon: LucideIcon;
    }
);

const sidebar: SidebarItem[] = [
  {
    type: "group",
    title: "Application",
    role: "user",
    items: [
      {
        type: "item",
        title: "Home",
        url: "/home",
        icon: Home,
        role: "user",
      },
      {
        type: "item",
        title: "Team",
        url: "#",
        icon: Inbox,
        role: "user",
      },
      {
        type: "item",
        title: "Competition",
        url: "#",
        icon: Calendar,
        role: "user",
      },
      {
        type: "item",
        title: "Users",
        url: "#",
        icon: Search,
        role: "user",
      },
    ],
  },
  {
    type: "group",
    title: "Management",
    role: "admin",
    items: [
      {
        type: "item",
        title: "Competitions",
        url: "#",
        icon: Calendar,
        role: "admin",
      },
      {
        type: "item",
        title: "Teams",
        url: "#",
        icon: Inbox,
        role: "admin",
      },
      {
        type: "item",
        title: "Users",
        url: "/manage/users",
        icon: Search,
        role: "admin",
      },
    ],
  },
];

export function AppSidebar() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const isAdmin = loggedInUser?.role === "admin";
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
  }, [isAuthenticated]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {sidebar.map((item) => renderItem(item, isAdmin))}
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
    </Sidebar>
  );
}

function renderItem(item: SidebarItem, isAdmin: boolean) {
  if (item.role === "admin" && !isAdmin) return;

  if (item.type !== "group")
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
          {item.items.map((subItem) => renderItem(subItem, isAdmin))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
