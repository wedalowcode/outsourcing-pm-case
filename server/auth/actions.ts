"use server";

import { loginSchema } from "@/server/auth/schema";
import { verifyCredentials } from "@/server/auth/verify-credentials";
import {
  createSession,
  deleteCurrentSession,
} from "@/server/auth/session";

export type LoginActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function loginAction(
  input: unknown,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "请检查用户名和密码的输入格式",
    };
  }

  try {
    const result = await verifyCredentials(parsed.data);

    if (!result.ok) {
      return {
        ok: false,
        message: "用户名或密码错误，或账号不可用",
      };
    }

    await createSession(result.user.id);

    return {
      ok: true,
    };
  } catch (error) {
    console.error("登录处理失败", error);

    return {
      ok: false,
      message: "登录失败，请稍后重试",
    };
  }
}

export async function logoutAction() {
  await deleteCurrentSession();

  return {
    ok: true as const,
  };
}
