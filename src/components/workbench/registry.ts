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
    path: "/workbench/components/eyebrow",
    label: "Eyebrow",
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
];

export const GROUPED_WORKBENCH_ENTRIES: Map<string, WorkbenchEntry[]> =
  WORKBENCH_ENTRIES.reduce((groups, entry) => {
    const list = groups.get(entry.group) ?? [];
    list.push(entry);
    groups.set(entry.group, list);
    return groups;
  }, new Map<string, WorkbenchEntry[]>());
