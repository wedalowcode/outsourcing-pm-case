"use server";

import { revalidatePath } from "next/cache";
import { BizError } from "@/lib/biz-error";
import { getCurrentSession } from "@/server/auth/session";
import * as deptService from "./service";
import { DeptInputSchema } from "./schema";

/**
 * 统一处理服务层调用结果。
 *
 * 成功：刷新部门管理页面，并返回成功状态。
 * 业务错误：返回具体原因。
 * 其他错误：记录服务端日志，返回通用提示。
 */
async function run(
  fn: () => Promise<unknown>,
  fallback: string,
) {
  try {
    await fn();

    revalidatePath("/dept");

    return { ok: true as const };
  } catch (error) {
    if (error instanceof BizError) {
      return {
        ok: false as const,
        message: error.message,
      };
    }

    console.error(error);

    return {
      ok: false as const,
      message: fallback,
    };
  }
}

/**
 * 校验部门表单输入。
 *
 * 参数写成 unknown：进入这里的数据还没通过验证，不能当作 DeptInput 使用。
 */
function validateDeptInput(input: unknown) {
  const result = DeptInputSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false as const,
      message: result.error.issues[0]?.message ?? "输入数据不合法",
    };
  }

  return {
    ok: true as const,
    data: result.data,
  };
}

/** 新增部门 */
export async function createDeptAction(input: unknown) {
  const session = await getCurrentSession();

  if (!session) {
    return {
      ok: false as const,
      message: "登录状态已失效，请重新登录",
    };
  }

  const validation = validateDeptInput(input);

  if (!validation.ok) {
    return validation;
  }

  return run(
    () => deptService.createDept(validation.data),
    "保存失败，请稍后重试",
  );
}

/** 修改部门 */
export async function updateDeptAction(
  id: string,
  input: unknown,
) {
  const session = await getCurrentSession();

  if (!session) {
    return {
      ok: false as const,
      message: "登录状态已失效，请重新登录",
    };
  }

  if (typeof id !== "string" || id.trim() === "") {
    return {
      ok: false as const,
      message: "部门 ID 不合法",
    };
  }

  const validation = validateDeptInput(input);

  if (!validation.ok) {
    return validation;
  }

  return run(
    () => deptService.updateDept(id, validation.data),
    "保存失败，请稍后重试",
  );
}

/** 删除部门 */
export async function deleteDeptAction(id: unknown) {
  const session = await getCurrentSession();

  if (!session) {
    return {
      ok: false as const,
      message: "登录状态已失效，请重新登录",
    };
  }

  if (typeof id !== "string" || id.trim() === "") {
    return {
      ok: false as const,
      message: "部门 ID 不合法",
    };
  }

  return run(
    () => deptService.deleteDept(id),
    "删除失败，请稍后重试",
  );
}
