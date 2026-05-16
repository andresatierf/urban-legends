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
];

export function groupedEntries(): Map<string, WorkbenchEntry[]> {
  const groups = new Map<string, WorkbenchEntry[]>();
  for (const entry of WORKBENCH_ENTRIES) {
    const list = groups.get(entry.group) ?? [];
    list.push(entry);
    groups.set(entry.group, list);
  }
  return groups;
}
