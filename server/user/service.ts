import "server-only";
import { db } from "@/lib/db";

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
