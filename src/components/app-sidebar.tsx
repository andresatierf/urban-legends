"use client";

import {
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  PlusCircle,
  Trophy,
  UserCog,
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
import { useUser } from "@/hooks/useUser";
import { UpsertSubmissionFormDialog } from "./form/upsert-submission-form";
import { LoggedUserCard } from "./logged-user-card";

type SidebarItem = {
  title: string;
  roles?: string[];
} & (
  | { items: SidebarItem[] }
  | ({ icon: LucideIcon } & ({ href: string } | { onClick: () => void }))
);

function useSidebarItems(setSubmissionFormOpen: (state: boolean) => void) {
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
          {
            title: tAdminItems("users"),
            icon: UserCog,
            href: "/users",
          },
        ],
      },
    ],
    [tUserItems, tAdminItems, setSubmissionFormOpen],
  );

  return { items: sidebar };
}

export function AppSidebar() {
  const { user } = useUser();

  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const { items: sidebarItems } = useSidebarItems(setSubmissionFormOpen);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-10" />
      <SidebarContent>
        {sidebarItems.map((item) => renderItem(item, user?.roleNames || []))}
        <UpsertSubmissionFormDialog
          open={submissionFormOpen}
          onOpenChange={setSubmissionFormOpen}
        />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="">
        <LoggedUserCard />
      </SidebarFooter>
    </Sidebar>
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

  if ("onClick" in item)
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton onClick={item.onClick}>
          <item.icon />
          {item.title}
        </SidebarMenuButton>
      </SidebarMenuItem>
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
