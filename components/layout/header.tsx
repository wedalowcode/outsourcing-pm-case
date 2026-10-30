import { UserActions } from "./user-actions";

export function Header({ userName }: { userName: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <span className="text-sm text-muted-foreground">项目管理系统</span>
      <UserActions userName={userName} />
    </header>
  );
}
