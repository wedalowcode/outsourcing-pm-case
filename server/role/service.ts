import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import type { CreateRoleInput } from "./schema";

export type RoleListParams = {
  keyword?: string;
  status?: "ACTIVE" | "DISABLED" | "ALL";
  page?: number;
  pageSize?: number;
};

const MAX_PAGE_SIZE = 100;

function normalizePage(value: number | undefined) {
  if (!Number.isSafeInteger(value) || value! < 1) {
    return 1;
  }

  return value!;
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isSafeInteger(value) || value! < 1) {
    return 10;
  }

  return Math.min(value!, MAX_PAGE_SIZE);
}

function normalizeStatus(
  value: RoleListParams["status"],
): RoleListParams["status"] {
  if (
    value === "ACTIVE" ||
    value === "DISABLED" ||
    value === "ALL"
  ) {
    return value;
  }

  return "ALL";
}

export async function listRoles(
  params: RoleListParams = {},
) {
  const keyword =
    params.keyword?.trim().slice(0, 100) ?? "";

  const status = normalizeStatus(params.status);
  const requestedPage = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);

  const where: Prisma.RoleWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(keyword
      ? {
          OR: [
            {
              code: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: keyword,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const total = await db.role.count({ where });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(
    requestedPage,
    totalPages,
  );

  const items = await db.role.findMany({
    where,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      _count: {
        select: {
          userRoles: true,
          rolePermissions: true,
        },
      },
    },
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export type CreateRoleResult =
  | {
      success: true;
    }
  | {
      success: false;
      code: "ROLE_CODE_EXISTS" | "ERROR";
      message: string;
    };

export async function createRole(
  input: CreateRoleInput,
): Promise<CreateRoleResult> {
  const code = input.code.trim().toUpperCase();

  // 1. 预先检查角色编码，提供友好的错误提示。
  const existingRole = await db.role.findUnique({
    where: { code },
    select: { id: true },
  });

  if (existingRole) {
    return {
      success: false,
      code: "ROLE_CODE_EXISTS",
      message: "该角色编码已存在",
    };
  }

  try {
    // 2. 只创建角色基础资料，不在这里分配权限。
    await db.role.create({
      data: {
        code,
        name: input.name.trim(),
        description: input.description,
        status: input.status,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    // 3. 处理并发创建造成的唯一键冲突。
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        code: "ROLE_CODE_EXISTS",
        message: "该角色编码已存在",
      };
    }

    throw error;
  }
}
