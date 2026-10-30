"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/auth/actions";

export function UserActions({ userName }: { userName: string }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setErrorMessage("");

    try {
      const result = await logoutAction();

      if (result.ok) {
        router.replace("/login");
        // 成功：保持 "退出中..." 直到页面跳转，不恢复按钮
        return;
      }

      setErrorMessage("退出登录失败，请重试");
    } catch {
      setErrorMessage("退出登录失败，请稍后重试");
    }

    // 只有失败才会走到这里，恢复按钮可点状态
    setIsLoggingOut(false);
  }

  return (
    <div className="flex items-center gap-3">
      {/* 错误提示放在名字左边，出现时按钮位置不动 */}
      {errorMessage && (
        <span className="text-sm text-destructive" role="alert">
          {errorMessage}
        </span>
      )}

      <span className="text-sm text-muted-foreground">{userName}</span>

      <Button
        variant="outline"
        size="sm"
        disabled={isLoggingOut}
        onClick={handleLogout}
      >
        {isLoggingOut ? "退出中..." : "退出登录"}
      </Button>
    </div>
  );
}
