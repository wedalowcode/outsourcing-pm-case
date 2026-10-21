"use server";

import { loginSchema } from "@/server/auth/schema";
import { verifyCredentials } from "@/server/auth/verify-credentials";

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

    return {
      ok: true,
    };
  } catch (error) {
    console.error("登录凭据验证失败", error);

    return {
      ok: false,
      message: "服务暂时不可用，请稍后重试",
    };
  }
}
