"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const NAV_ITEMS = [
  { label: "工作台", href: "/dashboard" },
  { label: "部门管理", href: "/dept" },
  { label: "用户管理", href: "/users" },
  { label: "角色管理", href: "/roles" },
];

export function SidebarMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2.5 text-sm transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent font-medium text-accent-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
