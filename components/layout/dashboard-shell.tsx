"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { logoutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    title: "工作台",
    href: "/dashboard",
  },
  {
    title: "部门管理",
    href: "/dept",
  },
];

type DashboardUser = {
  id: string;
  username: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
};

type DashboardShellProps = {
  children: ReactNode;
  user: DashboardUser;
};

export function DashboardShell({
  children,
  user,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const result = await logoutAction();

      if (!result.ok) {
        setLogoutError("退出登录失败，请重试");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("退出登录失败，请稍后重试");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* 左侧导航栏 */}
      <aside className="flex w-60 shrink-0 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-semibold">
            项目管理平台
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center rounded-md px-3 py-2.5",
                  "text-sm transition-colors",
                  active
                    ? "bg-slate-100 font-medium text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                ].join(" ")}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4 text-xs text-slate-500">
          全栈实战项目
        </div>
      </aside>

      {/* 右侧区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 顶部导航栏 */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
          <div className="text-sm text-slate-500">
            项目管理系统
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {user.name}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              {loggingOut ? "退出中..." : "退出登录"}
            </Button>

            {logoutError && (
              <span className="text-sm text-destructive" role="alert">
                {logoutError}
              </span>
            )}
          </div>
        </header>

        {/* 当前页面内容 */}
        <main className="min-w-0 flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
