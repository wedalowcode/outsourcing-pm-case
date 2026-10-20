import "server-only";
import { db } from "@/lib/db";
import { BizError } from "@/lib/biz-error";
import {
  nextDeptCode,
  nextSort,
  type Tx,
} from "@/server/dept/dept-tools";
import type { DeptInput } from "@/server/dept/types";

/** 全量读取：给组织树和“上级部门名称”用 */
export async function listDepts() {
  return db.dept.findMany({
    orderBy: [{ sort: "asc" }, { name: "asc" }],
  });
}

/** 部门列表分页查询：筛选与分页都在数据库完成 */
export async function listDeptPage(options: {
  keyword?: string;
  parentId?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = options.pageSize ?? 10;
  const keyword = options.keyword?.trim();

  // where 是“动态拼装”的：条件为空时就不加入此条件
  const where = {
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: "insensitive" as const } },
            { code: { contains: keyword, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(options.parentId ? { parentId: options.parentId } : {}),
  };

  // 先查总数：算出总页数，才能把 page 限制在合法范围内
  const total = await db.dept.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Math.floor(options.page ?? 1)), pageCount);

  const rows = await db.dept.findMany({
    where,
    orderBy: [{ sort: "asc" }, { name: "asc" }],
    skip: (page - 1) * pageSize, // 跳过前面几页
    take: pageSize, // 只取一页
  });

  return { rows, total, page, pageSize };
}

/**
 * 校验输入并规范化字符串。
 */
function validate(input: DeptInput) {
  if (typeof input.name !== "string") {
    throw new BizError("请填写部门名称");
  }

  const name = input.name.trim();

  if (!name) {
    throw new BizError("请填写部门名称");
  }

  if (name.length > 50) {
    throw new BizError("部门名称不能超过 50 个字");
  }

  if (
    input.sort !== undefined &&
    !Number.isInteger(input.sort)
  ) {
    throw new BizError("排序必须是整数");
  }

  if (
    input.status !== undefined &&
    input.status !== 0 &&
    input.status !== 1
  ) {
    throw new BizError("状态只能是启用或停用");
  }

  if (
    input.description !== undefined &&
    typeof input.description !== "string"
  ) {
    throw new BizError("部门描述格式不正确");
  }

  return {
    name,
    description:
      input.description === undefined
        ? undefined
        : input.description.trim() || null,
  };
}

/**
 * 防止将自己或自己的下级设为上级。
 */
async function assertNoCycle(
  tx: Tx,
  id: string,
  parentId: string
) {
  const all = await tx.dept.findMany({
    select: {
      id: true,
      parentId: true,
    },
  });

  const parentOf = new Map(
    all.map((row) => [row.id, row.parentId])
  );

  let cursor: string | null = parentId;

  while (cursor) {
    if (cursor === id) {
      throw new BizError(
        "不能把自己（或其下级）设为上级，会形成循环"
      );
    }

    cursor = parentOf.get(cursor) ?? null;
  }
}

/**
 * 将当前部门所有下级的编码前缀同步更新。
 */
async function recodeDescendants(
  tx: Tx,
  id: string,
  oldCode: string,
  newCode: string
) {
  const all = await tx.dept.findMany({
    select: {
      id: true,
      parentId: true,
      code: true,
    },
  });

  const childrenOf = new Map<
    string,
    typeof all
  >();

  for (const row of all) {
    if (!row.parentId) continue;

    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row);
    childrenOf.set(row.parentId, list);
  }

  const queue = [id];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const child of childrenOf.get(current) ?? []) {
      if (!child.code.startsWith(`${oldCode}-`)) {
        throw new BizError(
          "下级部门的编码与上级不一致，请先修正数据"
        );
      }

      await tx.dept.update({
        where: { id: child.id },
        data: {
          code: newCode + child.code.slice(oldCode.length),
        },
      });

      queue.push(child.id);
    }
  }
}

/**
 * 新增部门。
 * 编码分配、排序计算和部门写入在同一个事务中完成。
 */
export async function createDept(input: DeptInput) {
  const { name, description } = validate(input);
  const parentId = input.parentId ?? null;

  return db.$transaction(async (tx) => {
    // 1. 检查上级部门，并分配编码
    const code = await nextDeptCode(tx, parentId);

    // 2. 如果没有指定排序值，则计算同级最大值 + 10
    const sort =
      input.sort ?? (await nextSort(tx, parentId));

    // 3. 写入部门
    return tx.dept.create({
      data: {
        name,
        code,
        parentId,
        sort,
        status: input.status ?? 1,
        description: description ?? null,
      },
    });
  });
}

/**
 * 修改部门。
 * 调整上级时，重新分配编码并同步更新全部下级。
 */
export async function updateDept(
  id: string,
  input: DeptInput
) {
  const { name, description } = validate(input);
  const parentId = input.parentId ?? null;

  return db.$transaction(async (tx) => {
    // 1. 查询当前部门
    const row = await tx.dept.findUnique({
      where: { id },
    });

    if (!row) {
      throw new BizError("部门不存在，可能已被删除");
    }

    // 2. 默认保留原编码和原排序
    let code = row.code;
    let sort = input.sort ?? row.sort;

    // 3. 判断上级是否变化
    const parentChanged = parentId !== row.parentId;

    if (parentChanged) {
      // 新上级不能是自己或自己的下级
      if (parentId) {
        await assertNoCycle(tx, id, parentId);
      }

      // 为新层级分配编码
      code = await nextDeptCode(tx, parentId);

      // 未指定排序时，排到新上级的末尾
      if (input.sort === undefined) {
        sort = await nextSort(tx, parentId);
      }
    }

    // 4. 更新当前部门
    const updated = await tx.dept.update({
      where: { id },
      data: {
        name,
        code,
        parentId,
        sort,
        status: input.status ?? row.status,
        description:
          description === undefined
            ? row.description
            : description,
      },
    });

    // 5. 上级发生变化时，同步更新全部下级
    if (parentChanged) {
      await recodeDescendants(
        tx,
        id,
        row.code,
        code
      );
    }

    return updated;
  });
}

/**
 * 删除部门。
 * 存在下级时禁止删除。
 */
export async function deleteDept(id: string) {
  return db.$transaction(async (tx) => {
    // 1. 查询当前部门
    const row = await tx.dept.findUnique({
      where: { id },
    });

    if (!row) {
      throw new BizError("部门不存在，可能已被删除");
    }

    // 2. 检查是否存在下级部门
    const child = await tx.dept.findFirst({
      where: { parentId: id },
      select: { id: true },
    });

    if (child) {
      throw new BizError(
        "存在下级部门，不能删除，建议改用停用"
      );
    }

    // 3. 删除部门
    return tx.dept.delete({
      where: { id },
    });
  });
}