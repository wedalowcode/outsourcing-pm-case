"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/lib/generated/prisma/client";
import { getCurrentSession } from "@/server/auth/session";
import { createRole, updateRole } from "@/server/role/service";
import {
  createRoleSchema,
  updateRoleSchema,
} from "@/server/role/schema";

export type CreateRoleActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createRoleAction(
  input: unknown,
): Promise<CreateRoleActionState> {
  // 1. 检查登录状态。
  const session = await getCurrentSession();

  if (!session) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  // 2. 在这里接入项目实际的权限校验。
  // 例如：要求当前用户拥有 role:create 权限。
  // 不要仅凭登录成功就允许创建角色。
  //
  // await requirePermission("role:create");

  // 3. 服务端重新校验输入。
  const parsed = createRoleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "请检查输入内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // 4. 调用 Service。
    const result = await createRole(parsed.data);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    // 5. 刷新角色管理页面。
    revalidatePath("/roles");

    return {
      success: true,
      message: "角色创建成功",
    };
  } catch (error) {
    console.error("createRoleAction failed", error);

    return {
      success: false,
      message: "创建角色失败，请稍后重试",
    };
  }
}

export async function updateRoleAction(
  input: unknown,
): Promise<CreateRoleActionState> {
  // 1. 检查登录状态。
  const session = await getCurrentSession();

  if (!session) {
    return {
      success: false,
      message: "登录状态已失效，请重新登录",
    };
  }

  // 2. 在这里接入项目实际的权限校验。
  // 例如：要求当前用户拥有 role:update 权限。
  //
  // await requirePermission("role:update");

  // 3. 服务端重新校验输入。
  const parsed = updateRoleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "请检查输入内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // 4. 调用 Service。
    const result = await updateRole(parsed.data);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    // 5. 刷新角色列表。
    revalidatePath("/roles");

    return {
      success: true,
      message: "角色资料更新成功",
    };
  } catch (error) {
    // 目标角色可能在查询后、更新前被删除。
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message: "角色不存在或已被删除",
      };
    }

    console.error("updateRoleAction failed", error);

    return {
      success: false,
      message: "更新角色资料失败，请稍后重试",
    };
  }
}
