import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/app-layout";
import { getCurrentSession } from "@/server/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AppLayout userName={session.user.name}>
      {children}
    </AppLayout>
  );
}
