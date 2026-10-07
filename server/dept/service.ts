import "server-only";

import { db } from "@/lib/db";

// 从数据库全量读取扁平部门列表
export async function listDepts() {
  return db.dept.findMany({
    orderBy: [{ sort: "asc" }, { name: "asc" }],
  });
}