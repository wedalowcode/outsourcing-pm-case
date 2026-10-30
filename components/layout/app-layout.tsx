import type { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppLayout({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userName={userName} />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
