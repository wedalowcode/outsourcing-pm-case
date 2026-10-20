import { db } from "../lib/db";

/** 扫描现有编码，按"范围"取最大序号，写入计数器。只需要在启用新增功能之前跑一次。 */
async function main() {
  const rows = await db.dept.findMany({ select: { parentId: true, code: true } });

  const maxByScope = new Map<string, number>();
  for (const row of rows) {
    const seq = Number(row.code.match(/(\d+)$/)?.[1] ?? 0); // 取编码最后一段数字
    const scope = row.parentId ?? "__ROOT__";
    maxByScope.set(scope, Math.max(maxByScope.get(scope) ?? 0, seq));
  }

  for (const [scope, value] of maxByScope) {
    await db.deptCodeCounter.upsert({
      where: { scope },
      update: { value },
      create: { scope, value },
    });
  }
  console.log("回填完成：", Object.fromEntries(maxByScope));
}

main().finally(() => db.$disconnect());