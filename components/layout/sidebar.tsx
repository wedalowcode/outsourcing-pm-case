import { SidebarMenu } from "./sidebar-menu";

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6 text-lg font-semibold">
        项目管理平台
      </div>
      <SidebarMenu />
      <div className="border-t p-4 text-xs text-muted-foreground">
        全栈实战项目
      </div>
    </aside>
  );
}
