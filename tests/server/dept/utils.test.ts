import { describe, it, expect, vi } from "vitest";
import {
  formatCode,
  nextDeptCode,
  nextSort,
  type Tx,
} from "@/server/dept/utils";

/**
 * 创建假的事务客户端。
 * 通过参数指定数据库操作的返回结果。
 */
function fakeTx(opts: {
  parentCode?: string;
  parentMissing?: boolean;
  counter?: number;
  maxSort?: number | null;
}) {
  const parentMissing = opts.parentMissing ?? false;

  return {
    dept: {
      findUnique: vi.fn().mockResolvedValue(
        parentMissing
          ? null
          : opts.parentCode === undefined
            ? null
            : { code: opts.parentCode }
      ),
      aggregate: vi.fn().mockResolvedValue({
        _max: {
          sort: opts.maxSort ?? null,
        },
      }),
    },
    deptCodeCounter: {
      upsert: vi.fn().mockResolvedValue({
        value: opts.counter ?? 1,
      }),
    },
  } as unknown as Tx;
}

describe("formatCode", () => {
  it("生成顶级部门编码", () => {
    expect(formatCode(null, 1)).toBe("D001");
    expect(formatCode(null, 12)).toBe("D012");
  });

  it("生成下级部门编码", () => {
    expect(formatCode("D001", 3)).toBe("D001-03");
    expect(formatCode("D001-01", 1)).toBe("D001-01-01");
  });
});

describe("nextDeptCode", () => {
  it("为顶级部门分配编码", async () => {
    const tx = fakeTx({ counter: 4 });

    await expect(nextDeptCode(tx, null)).resolves.toBe("D004");
    expect(tx.deptCodeCounter.upsert).toHaveBeenCalledWith({
      where: { scope: "__ROOT__" },
      update: { value: { increment: 1 } },
      create: { scope: "__ROOT__", value: 1 },
    });
  });

  it("为子部门分配编码", async () => {
    const tx = fakeTx({
      parentCode: "D001",
      counter: 3,
    });

    await expect(nextDeptCode(tx, "parent-id")).resolves.toBe(
      "D001-03"
    );
  });

  it("上级部门不存在时抛出业务错误", async () => {
    const tx = fakeTx({ parentMissing: true });

    await expect(
      nextDeptCode(tx, "no-such-id")
    ).rejects.toThrow("上级部门不存在");

    expect(tx.deptCodeCounter.upsert).not.toHaveBeenCalled();
  });
});

describe("nextSort", () => {
  it("没有同级部门时返回 10", async () => {
    const tx = fakeTx({ maxSort: null });

    await expect(nextSort(tx, null)).resolves.toBe(10);
  });

  it("同级最大排序值为 30 时返回 40", async () => {
    const tx = fakeTx({ maxSort: 30 });

    await expect(nextSort(tx, "parent-id")).resolves.toBe(40);
  });
});