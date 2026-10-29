import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";
import type { CreateUserInput } from "./schema";

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
