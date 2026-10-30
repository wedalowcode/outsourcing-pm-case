import type { Prisma } from "@/lib/generated/prisma/client";
import { BizError } from "@/lib/biz-error";

/** 事务客户端类型：$transaction 回调里拿到的 tx */
export type Tx = Prisma.TransactionClient;

export const ROOT_SCOPE = "__ROOT__";

/** 纯函数：上级编码 + 序号 → 完整编码。顶级 D001，下级 D001-01 */
export function formatCode(parentCode: string | null, seq: number): string {
  return parentCode
    ? `${parentCode}-${String(seq).padStart(2, "0")}`
    : `D${String(seq).padStart(3, "0")}`;
}

/**
 * 分配下一个部门编码。
 * 必须在事务里调用：计数器 +1 和部门插入要同生共死，由调用方决定何时提交。
 */
export async function nextDeptCode(tx: Tx, parentId: string | null): Promise<string> {
  let parentCode: string | null = null;
  if (parentId) {
    const parent = await tx.dept.findUnique({
      where: { id: parentId },
      select: { code: true },
    });
    if (!parent) throw new BizError("上级部门不存在");
    parentCode = parent.code;
  }

  const scope = parentId ?? ROOT_SCOPE;
  const counter = await tx.deptCodeCounter.upsert({
    where: { scope },
    update: { value: { increment: 1 } }, // 原子自增，事务内会锁住这一行
    create: { scope, value: 1 },          // 该范围第一次分配
  });
  return formatCode(parentCode, counter.value);
}

/** 同级现有最大排序 + 10；没有同级则从 10 开始 */
export async function nextSort(tx: Tx, parentId: string | null): Promise<number> {
  const result = await tx.dept.aggregate({
    where: { parentId },
    _max: { sort: true },
  });
  return (result._max.sort ?? 0) + 10;
}
