"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import { createUser } from "@/server/user/service";
import { createUserSchema } from "@/server/user/schema";

export type CreateUserActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createUserAction(
  input: unknown,
): Promise<CreateUserActionState> {
  // 1. 检查登录状态。
  const session = await getCurrentSession();

  if (!session) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  // 2. 在这里接入项目实际的权限校验。
  // 例如：要求当前用户拥有 user:create 权限。
  // 不要仅凭前端隐藏按钮来控制权限。
  //
  // await requirePermission("user:create");

  // 3. 服务端重新校验输入。
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "请检查输入内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // 4. 调用 Service。
    const result = await createUser(parsed.data);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    // 5. 刷新用户列表。
    revalidatePath("/users");

    return {
      success: true,
      message: "用户创建成功",
    };
  } catch (error) {
    console.error("createUserAction failed", error);

    return {
      success: false,
      message: "创建用户失败，请稍后重试",
    };
  }
}
