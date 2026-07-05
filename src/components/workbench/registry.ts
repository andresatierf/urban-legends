export type WorkbenchEntry = {
  path: string;
  label: string;
  group: string;
};

export const WORKBENCH_ENTRIES: WorkbenchEntry[] = [
  {
    path: "/workbench/primitives/tokens",
    label: "Tokens",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/buttons",
    label: "Buttons",
    group: "primitives",
  },
  { path: "/workbench/primitives/cards", label: "Cards", group: "primitives" },
  {
    path: "/workbench/primitives/badges",
    label: "Badges",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/inputs",
    label: "Inputs",
    group: "primitives",
  },
  { path: "/workbench/primitives/table", label: "Table", group: "primitives" },
  {
    path: "/workbench/primitives/avatar",
    label: "Avatar",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/progress",
    label: "Progress",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/ribbons",
    label: "Ribbons",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/overlays",
    label: "Overlays",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/tabs",
    label: "Tabs",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/section-header",
    label: "Section Header",
    group: "primitives",
  },
  {
    path: "/workbench/primitives/chart",
    label: "Chart",
    group: "primitives",
  },
  {
    path: "/workbench/components/eyebrow",
    label: "Eyebrow",
    group: "components",
  },
  {
    path: "/workbench/components/card-toolkit",
    label: "Card Toolkit",
    group: "components",
  },
  {
    path: "/workbench/components/tournament-card",
    label: "Tournament Card",
    group: "components",
  },
  {
    path: "/workbench/components/team-card",
    label: "Team Card",
    group: "components",
  },
  {
    path: "/workbench/components/submission-card",
    label: "Submission Card",
    group: "components",
  },
  {
    path: "/workbench/components/join-team-card",
    label: "Join Team Card",
    group: "components",
  },
  {
    path: "/workbench/components/invitations",
    label: "Invitations",
    group: "components",
  },
  {
    path: "/workbench/components/invitation-lists",
    label: "Invitation Lists",
    group: "components",
  },
  {
    path: "/workbench/components/notification-indicator",
    label: "Notification Indicator",
    group: "components",
  },
  {
    path: "/workbench/components/user-cards",
    label: "User Cards",
    group: "components",
  },
  {
    path: "/workbench/components/page-shell",
    label: "Page Shell",
    group: "components",
  },
  {
    path: "/workbench/components/race-chart",
    label: "Race Chart",
    group: "components",
  },
  {
    path: "/workbench/pages/dashboard",
    label: "Dashboard",
    group: "pages",
  },
  {
    path: "/workbench/pages/tournaments",
    label: "Tournaments listing",
    group: "pages",
  },
  {
    path: "/workbench/pages/teams",
    label: "Teams listing",
    group: "pages",
  },
  {
    path: "/workbench/components/system-panels",
    label: "System Panels",
    group: "components",
  },
  {
    path: "/workbench/states/empty-loading",
    label: "Empty & Loading",
    group: "states",
  },
];

export const GROUPED_WORKBENCH_ENTRIES: Map<string, WorkbenchEntry[]> =
  WORKBENCH_ENTRIES.reduce((groups, entry) => {
    const list = groups.get(entry.group) ?? [];
    list.push(entry);
    groups.set(entry.group, list);
    return groups;
  }, new Map<string, WorkbenchEntry[]>());
