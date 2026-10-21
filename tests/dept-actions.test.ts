import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { BizError } from "@/lib/biz-error";

// actions 链路里包含 `import "server-only"`（经由 session.ts 引入），
// 在 Node 测试环境直接加载会抛错。这里把它换成空模块。
vi.mock("server-only", () => ({}));

// 使用 vi.hoisted 创建 Mock 函数，确保它们可以被 vi.mock 使用。
const mocks = vi.hoisted(() => ({
  createDept: vi.fn(),
  updateDept: vi.fn(),
  deleteDept: vi.fn(),
  revalidatePath: vi.fn(),
  getCurrentSession: vi.fn(),
}));

// 模拟 Service 层，不连接真实数据库。
vi.mock("@/server/dept/service", () => ({
  createDept: mocks.createDept,
  updateDept: mocks.updateDept,
  deleteDept: mocks.deleteDept,
}));

// 模拟 Next.js 的缓存重新验证函数。
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

// 模拟会话服务，避免读取真实 Cookie 和数据库。
vi.mock("@/server/auth/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

// 引入待测试的 Action。
import {
  createDeptAction,
  updateDeptAction,
  deleteDeptAction,
} from "@/server/dept/actions";

describe("部门管理 Server Actions", () => {
  beforeEach(() => {
    // 清除上一次测试的调用记录。
    vi.clearAllMocks();

    // 默认让 Service 正常执行。
    mocks.createDept.mockResolvedValue({});
    mocks.updateDept.mockResolvedValue({});
    mocks.deleteDept.mockResolvedValue(undefined);

    // 默认视为已登录。
    mocks.getCurrentSession.mockResolvedValue({
      sessionId: "session-1",
      user: {
        id: "user-1",
        username: "admin",
        name: "系统管理员",
        status: "ACTIVE",
      },
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  describe("createDeptAction", () => {
    it("合法输入：调用 Service 并返回成功", async () => {
      const input = {
        name: "研发部",
        parentId: null,
        sort: 10,
        status: 1,
        description: "负责研发工作",
      };

      const result = await createDeptAction(input);

      expect(result).toEqual({ ok: true });

      // 验证传给 Service 的数据已经通过 Schema 解析。
      expect(mocks.createDept).toHaveBeenCalledWith(input);

      // 验证成功后重新验证部门页面。
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/dept");
    });

    it("名称为空：返回校验错误，不调用 Service", async () => {
      const result = await createDeptAction({
        name: "   ",
        parentId: null,
      });

      expect(result).toEqual({
        ok: false,
        message: "请填写部门名称",
      });

      expect(mocks.createDept).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("名称带有首尾空格：传给 Service 的名称已经去空格", async () => {
      await createDeptAction({
        name: "  研发部  ",
        parentId: null,
      });

      expect(mocks.createDept).toHaveBeenCalledWith({
        name: "研发部",
        parentId: null,
      });
    });

    it("Service 抛出业务错误：返回具体错误信息", async () => {
      mocks.createDept.mockRejectedValue(
        new BizError("部门名称已被占用"),
      );

      const result = await createDeptAction({
        name: "研发部",
        parentId: null,
      });

      expect(result).toEqual({
        ok: false,
        message: "部门名称已被占用",
      });

      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("Service 抛出普通异常：返回通用提示", async () => {
      const error = new Error("数据库连接失败");

      mocks.createDept.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const result = await createDeptAction({
          name: "研发部",
          parentId: null,
        });

        expect(result).toEqual({
          ok: false,
          message: "保存失败，请稍后重试",
        });

        expect(consoleSpy).toHaveBeenCalledWith(error);
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("updateDeptAction", () => {
    it("合法输入：使用正确的 ID 和参数调用 Service", async () => {
      const input = {
        name: "研发中心",
        parentId: null,
        status: 1,
      };

      const result = await updateDeptAction(
        "dept-001",
        input,
      );

      expect(result).toEqual({ ok: true });

      expect(mocks.updateDept).toHaveBeenCalledWith(
        "dept-001",
        input,
      );

      expect(mocks.revalidatePath).toHaveBeenCalledWith("/dept");
    });

    it("ID 为空：拒绝调用 Service", async () => {
      const result = await updateDeptAction(
        "   ",
        {
          name: "研发中心",
          parentId: null,
        },
      );

      expect(result).toEqual({
        ok: false,
        message: "部门 ID 不合法",
      });

      expect(mocks.updateDept).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("输入校验失败：不调用 Service", async () => {
      const result = await updateDeptAction(
        "dept-001",
        {
          name: "",
          parentId: null,
        },
      );

      expect(result).toEqual({
        ok: false,
        message: "请填写部门名称",
      });

      expect(mocks.updateDept).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("Service 抛出业务错误：返回具体原因", async () => {
      mocks.updateDept.mockRejectedValue(
        new BizError("不能把自己设为上级部门"),
      );

      const result = await updateDeptAction(
        "dept-001",
        {
          name: "研发中心",
          parentId: null,
        },
      );

      expect(result).toEqual({
        ok: false,
        message: "不能把自己设为上级部门",
      });

      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("deleteDeptAction", () => {
    it("合法 ID：调用 Service 并返回成功", async () => {
      const result = await deleteDeptAction("dept-001");

      expect(result).toEqual({ ok: true });

      expect(mocks.deleteDept).toHaveBeenCalledWith("dept-001");
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/dept");
    });

    it("ID 不合法：拒绝调用 Service", async () => {
      const result = await deleteDeptAction("   ");

      expect(result).toEqual({
        ok: false,
        message: "部门 ID 不合法",
      });

      expect(mocks.deleteDept).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("存在下级部门：将业务错误返回给前端", async () => {
      mocks.deleteDept.mockRejectedValue(
        new BizError("存在下级部门，不能删除，建议改用停用"),
      );

      const result = await deleteDeptAction("dept-001");

      expect(result).toEqual({
        ok: false,
        message: "存在下级部门，不能删除，建议改用停用",
      });

      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("数据库异常：返回通用删除失败提示", async () => {
      const error = new Error("数据库连接失败");

      mocks.deleteDept.mockRejectedValue(error);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const result = await deleteDeptAction("dept-001");

        expect(result).toEqual({
          ok: false,
          message: "删除失败，请稍后重试",
        });

        expect(consoleSpy).toHaveBeenCalledWith(error);
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
