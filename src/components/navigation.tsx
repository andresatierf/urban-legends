import { SidebarTrigger } from "./ui/sidebar";

export function Navigation() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-1">
            <SidebarTrigger className=" size-16" />
            <h1 className="text-xl font-bold text-gray-900">BoolLegends</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
