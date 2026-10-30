/**
 * 部门服务层单元测试（对应教程 6.6）。
 *
 * 思路：用真实的 service 函数 + 模拟的数据库与工具函数，
 * 只验证业务规则是否正确，不连接真实数据库、也不启动事务。
 */
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// service.ts 开头有 `import "server-only"`：这是给 Server Component 用的标记模块，
// 在 Node 测试环境直接加载会抛错。这里把它换成空模块，让测试能引入服务层代码。
vi.mock("server-only", () => ({}));

// 模拟对象要提前创建，供下面的 vi.mock 工厂使用，因此用 vi.hoisted。
const mocks = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
  },
  nextDeptCode: vi.fn(),
  nextSort: vi.fn(),
}));

// 把真实数据库和工具函数替换为模拟对象
vi.mock("@/lib/db", () => ({
  db: mocks.db,
}));

vi.mock("@/server/dept/utils", () => ({
  nextDeptCode: mocks.nextDeptCode,
  nextSort: mocks.nextSort,
  ROOT_SCOPE: "__ROOT__",
}));

import {
  createDept,
  updateDept,
  deleteDept,
} from "@/server/dept/service";

/** 假的事务客户端：覆盖服务层在事务里会用到的全部方法 */
function fakeTx() {
  return {
    dept: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

type FakeTx = ReturnType<typeof fakeTx>;

let tx: FakeTx;

beforeEach(() => {
  vi.clearAllMocks();

  tx = fakeTx();

  // 模拟事务入口：立即执行回调，并把 fakeTx 当作事务客户端传进去
  mocks.db.$transaction.mockImplementation(
    async (callback: (client: FakeTx) => Promise<unknown>) =>
      callback(tx)
  );

  // 默认的编码与排序返回值
  mocks.nextDeptCode.mockResolvedValue("D001");
  mocks.nextSort.mockResolvedValue(10);
});

describe("createDept", () => {
  it("未指定排序和状态时使用默认值", async () => {
    tx.dept.create.mockResolvedValue({
      id: "dept-1",
      name: "技术部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: null,
    });

    const result = await createDept({
      name: "技术部",
      parentId: null,
    });

    expect(result.name).toBe("技术部");
    expect(result.code).toBe("D001");

    expect(mocks.nextDeptCode).toHaveBeenCalledWith(tx, null);
    expect(mocks.nextSort).toHaveBeenCalledWith(tx, null);

    expect(tx.dept.create).toHaveBeenCalledWith({
      data: {
        name: "技术部",
        code: "D001",
        parentId: null,
        sort: 10,
        status: 1,
        description: null,
      },
    });
  });

  it("显式传入排序值 0 时应保留 0", async () => {
    tx.dept.create.mockResolvedValue({
      id: "dept-2",
      name: "临时部门",
      code: "D001",
      parentId: null,
      sort: 0,
      status: 1,
      description: null,
    });

    await createDept({
      name: "临时部门",
      parentId: null,
      sort: 0,
    });

    expect(mocks.nextSort).not.toHaveBeenCalled();

    expect(tx.dept.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sort: 0,
      }),
    });
  });

  it("部门写入失败时应向外抛出异常", async () => {
    tx.dept.create.mockRejectedValue(
      new Error("database failure")
    );

    await expect(
      createDept({
        name: "技术部",
        parentId: null,
      })
    ).rejects.toThrow("database failure");
  });

  it("描述传空字符串时应存为 null", async () => {
    tx.dept.create.mockResolvedValue({
      id: "dept-3",
      name: "技术部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: null,
    });

    await createDept({
      name: "技术部",
      parentId: null,
      description: "",
    });

    expect(tx.dept.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: null,
      }),
    });
  });
});

describe("updateDept", () => {
  it("部门不存在时应拒绝修改", async () => {
    tx.dept.findUnique.mockResolvedValue(null);

    await expect(
      updateDept("missing-id", {
        name: "技术部",
        parentId: null,
      })
    ).rejects.toThrow("部门不存在，可能已被删除");

    expect(tx.dept.update).not.toHaveBeenCalled();
  });

  it("只修改名称时保留原编码", async () => {
    tx.dept.findUnique.mockResolvedValue({
      id: "dept-1",
      name: "技术部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: "原始描述",
    });

    tx.dept.update.mockResolvedValue({
      id: "dept-1",
      name: "研发部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: "原始描述",
    });

    await updateDept("dept-1", {
      name: "研发部",
      parentId: null,
    });

    // 上级没变，不应重新分配编码
    expect(mocks.nextDeptCode).not.toHaveBeenCalled();

    expect(tx.dept.update).toHaveBeenCalledWith({
      where: { id: "dept-1" },
      data: expect.objectContaining({
        name: "研发部",
        code: "D001",
        parentId: null,
        description: "原始描述",
      }),
    });
  });

  it("不能将自己的下级设为上级", async () => {
    // 技术部 → 开发组 → 前端组
    tx.dept.findUnique.mockResolvedValue({
      id: "tech",
      name: "技术部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: null,
    });

    tx.dept.findMany.mockResolvedValue([
      { id: "tech", parentId: null, code: "D001" },
      { id: "dev", parentId: "tech", code: "D001-01" },
      {
        id: "frontend",
        parentId: "dev",
        code: "D001-01-01",
      },
    ]);

    await expect(
      updateDept("tech", {
        name: "技术部",
        parentId: "frontend",
      })
    ).rejects.toThrow(
      "不能把自己（或其下级）设为上级，会形成循环"
    );

    expect(tx.dept.update).not.toHaveBeenCalled();
  });

  it("移动部门时应同步更新多级下级编码", async () => {
    // 移动前：技术部 D001 └── 开发组 D001-01 └── 前端组 D001-01-01
    tx.dept.findUnique.mockResolvedValue({
      id: "dev",
      name: "开发组",
      code: "D001-01",
      parentId: "tech",
      sort: 10,
      status: 1,
      description: null,
    });

    tx.dept.findMany
      // 第 1 次：防环检查读取的部门树
      .mockResolvedValueOnce([
        { id: "tech", parentId: null, code: "D001" },
        { id: "dev", parentId: "tech", code: "D001-01" },
        {
          id: "frontend",
          parentId: "dev",
          code: "D001-01-01",
        },
      ])
      // 第 2 次：编码同步读取的快照（此时开发组已改挂到新上级 sales 下）
      .mockResolvedValueOnce([
        { id: "tech", parentId: null, code: "D001" },
        { id: "dev", parentId: "sales", code: "D002-01" },
        {
          id: "frontend",
          parentId: "dev",
          code: "D001-01-01",
        },
      ]);

    mocks.nextDeptCode.mockResolvedValue("D002-01");
    mocks.nextSort.mockResolvedValue(20);

    tx.dept.update.mockResolvedValue({
      id: "dev",
      name: "开发组",
      code: "D002-01",
      parentId: "sales",
      sort: 20,
      status: 1,
      description: null,
    });

    await updateDept("dev", {
      name: "开发组",
      parentId: "sales",
    });

    // 当前部门换成新编码
    expect(tx.dept.update).toHaveBeenCalledWith({
      where: { id: "dev" },
      data: expect.objectContaining({
        code: "D002-01",
        parentId: "sales",
        sort: 20,
      }),
    });

    // 下级“前端组”的前缀也跟着替换
    expect(tx.dept.update).toHaveBeenCalledWith({
      where: { id: "frontend" },
      data: {
        code: "D002-01-01",
      },
    });
  });

  it("未传描述时保留原值，传空字符串时清空", async () => {
    tx.dept.findUnique.mockResolvedValue({
      id: "dept-1",
      name: "技术部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: "原始描述",
    });

    tx.dept.update.mockResolvedValue({});

    await updateDept("dept-1", {
      name: "技术部",
      parentId: null,
    });

    expect(tx.dept.update).toHaveBeenLastCalledWith({
      where: { id: "dept-1" },
      data: expect.objectContaining({
        description: "原始描述",
      }),
    });

    await updateDept("dept-1", {
      name: "技术部",
      parentId: null,
      description: "",
    });

    expect(tx.dept.update).toHaveBeenLastCalledWith({
      where: { id: "dept-1" },
      data: expect.objectContaining({
        description: null,
      }),
    });
  });
});

describe("deleteDept", () => {
  it("存在下级部门时拒绝删除", async () => {
    tx.dept.findUnique.mockResolvedValue({
      id: "tech",
      name: "技术部",
      code: "D001",
      parentId: null,
      sort: 10,
      status: 1,
      description: null,
    });

    tx.dept.findFirst.mockResolvedValue({
      id: "dev",
    });

    await expect(deleteDept("tech")).rejects.toThrow(
      "存在下级部门，不能删除，建议改用停用"
    );

    expect(tx.dept.delete).not.toHaveBeenCalled();
  });

  it("没有下级部门时执行删除", async () => {
    tx.dept.findUnique.mockResolvedValue({
      id: "dev",
      name: "开发组",
      code: "D001-01",
      parentId: "tech",
      sort: 10,
      status: 1,
      description: null,
    });

    tx.dept.findFirst.mockResolvedValue(null);

    tx.dept.delete.mockResolvedValue({
      id: "dev",
      name: "开发组",
    });

    const result = await deleteDept("dev");

    expect(result.id).toBe("dev");

    expect(tx.dept.delete).toHaveBeenCalledWith({
      where: { id: "dev" },
    });
  });
});
