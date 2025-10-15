import { SidebarTrigger } from "./ui/sidebar";

export function Navigation() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-1">
            <SidebarTrigger className="size-16" />
            <h1 className="font-bold text-gray-900 text-xl">BoolLegends</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
