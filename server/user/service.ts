import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";
import type { CreateUserInput, UpdateUserInput } from "./schema";

export type UserListOptions = {
  keyword?: string;
  status?: "ACTIVE" | "DISABLED";
  page?: number;
  pageSize?: number;
};

export async function listUserPage(
  options: UserListOptions = {}
) {
  const keyword = options.keyword?.trim() ?? "";
  const status = options.status;

  const pageSize = Math.min(
    Math.max(Math.floor(options.pageSize ?? 10), 1),
    100
  );

  const where = {
    ...(keyword
      ? {
          OR: [
            {
              username: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
            {
              name: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: keyword,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const total = await db.user.count({ where });

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const page = Math.min(
    Math.max(Math.floor(options.page ?? 1), 1),
    totalPages
  );

  const items = await db.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export type CreateUserResult =
  | { success: true }
  | {
      success: false;
      code: "USERNAME_EXISTS" | "INVALID_INPUT" | "ERROR";
      message: string;
    };

export async function createUser(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const username = input.username.trim();

  // 预先检查用户名，提供友好的错误提示。
  const existingUser = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      code: "USERNAME_EXISTS",
      message: "该用户名已存在",
    };
  }

  // 确认密码不参与持久化。
  const passwordHash = await hashPassword(input.password);

  try {
    await db.user.create({
      data: {
        username,
        name: input.name.trim(),
        email: input.email,
        phone: input.phone,
        passwordHash,
        status: input.status,
      },
    });

    return { success: true };
  } catch (error) {
    // 处理并发情况下两个请求同时创建同一用户名的问题。
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        code: "USERNAME_EXISTS",
        message: "该用户名已存在",
      };
    }

    throw error;
  }
}

export type UpdateUserResult =
  | { success: true }
  | {
      success: false;
      code: "NOT_FOUND";
      message: string;
    };

export async function updateUser(
  input: UpdateUserInput,
): Promise<UpdateUserResult> {
  const existingUser = await db.user.findUnique({
    where: { id: input.id },
    select: { id: true },
  });

  if (!existingUser) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "用户不存在或已被删除",
    };
  }

  await db.user.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      email: input.email,
      phone: input.phone,
      status: input.status,
    },
  });

  return { success: true };
}

export async function deleteUser(
  id: string,
  currentUserId: string,
) {
  if (id === currentUserId) {
    throw new Error("不能删除当前登录用户");
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      throw new Error("用户不存在或已被删除");
    }

    // 在这里检查项目中所有不可删除的业务关联。
    // 如果存在历史业务记录，拒绝物理删除。
    //
    // 例如：项目负责人、任务执行人、工时记录等。
    // 具体查询必须根据当前 Prisma Schema 实现。

    await tx.session.deleteMany({
      where: { userId: id },
    });

    await tx.userRole.deleteMany({
      where: { userId: id },
    });

    await tx.user.delete({
      where: { id },
    });

    return { id: user.id };
  });
}

export async function resetUserPassword(
  id: string,
  password: string,
  currentUserId: string,
) {
  if (id === currentUserId) {
    throw new Error("不能通过此操作重置自己的密码");
  }

  const passwordHash = await hashPassword(password);

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    await tx.user.update({
      where: { id },
      data: { passwordHash },
    });

    await tx.session.deleteMany({
      where: { userId: id },
    });

    return { id: user.id };
  });
}
