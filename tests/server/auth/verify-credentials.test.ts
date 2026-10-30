/**
 * 凭据验证服务单元测试（对应教程 7.5）。
 *
 * 思路：用真实的 verifyCredentials + 模拟的数据库与 argon2，
 * 只验证业务分支和返回结果，不连接真实数据库、不真正计算哈希。
 */
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// verify-credentials.ts 开头有 `import "server-only"`：这是给 Next.js 构建用的标记模块，
// 在 Node 测试环境直接加载会抛错。这里把它换成空模块，让测试能引入服务层代码。
vi.mock("server-only", () => ({}));

// 模拟对象要提前创建，供下面的 vi.mock 工厂使用，因此用 vi.hoisted。
const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("argon2", () => ({
  default: {
    verify: mocks.verify,
  },
}));

import { verifyCredentials } from "@/server/auth/verify-credentials";

const input = {
  username: "admin",
  password: "TestPassword@123",
};

const activeUser = {
  id: "user-1",
  username: "admin",
  name: "系统管理员",
  passwordHash: "fake-argon2-hash",
  status: "ACTIVE",
};

describe("verifyCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("用户不存在时拒绝登录", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const result = await verifyCredentials(input);

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_CREDENTIALS",
    });

    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("账号禁用时拒绝登录", async () => {
    mocks.findUnique.mockResolvedValue({
      ...activeUser,
      status: "DISABLED",
    });

    const result = await verifyCredentials(input);

    expect(result).toEqual({
      ok: false,
      reason: "ACCOUNT_DISABLED",
    });

    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("密码错误时拒绝登录", async () => {
    mocks.findUnique.mockResolvedValue(activeUser);
    mocks.verify.mockResolvedValue(false);

    const result = await verifyCredentials(input);

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_CREDENTIALS",
    });
  });

  it("密码正确时返回必要的用户信息", async () => {
    mocks.findUnique.mockResolvedValue(activeUser);
    mocks.verify.mockResolvedValue(true);

    const result = await verifyCredentials(input);

    expect(result).toEqual({
      ok: true,
      user: {
        id: "user-1",
        username: "admin",
        name: "系统管理员",
      },
    });

    expect(mocks.verify).toHaveBeenCalledWith(
      activeUser.passwordHash,
      input.password,
    );
  });

  it("数据库异常时抛出异常", async () => {
    mocks.findUnique.mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(
      verifyCredentials(input),
    ).rejects.toThrow("Database unavailable");
  });
});
