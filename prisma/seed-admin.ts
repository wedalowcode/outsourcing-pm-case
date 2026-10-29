import "dotenv/config";
import argon2 from "argon2";
import { db } from "../lib/db";

const permissions = [
  { code: "customer:read", name: "查看客户", resource: "customer", action: "read" },
  { code: "customer:create", name: "创建客户", resource: "customer", action: "create" },
  { code: "customer:update", name: "修改客户", resource: "customer", action: "update" },
  { code: "customer:delete", name: "删除客户", resource: "customer", action: "delete" },
  { code: "project:read", name: "查看项目", resource: "project", action: "read" },
  { code: "project:create", name: "创建项目", resource: "project", action: "create" },
  { code: "task:read", name: "查看任务", resource: "task", action: "read" },
  { code: "task:assign", name: "分配任务", resource: "task", action: "assign" },
  { code: "worklog:create", name: "创建工时记录", resource: "worklog", action: "create" },
];

async function main() {
  const username = process.env.INIT_ADMIN_USERNAME;
  const password = process.env.INIT_ADMIN_PASSWORD;
  const name = process.env.INIT_ADMIN_NAME;

  if (!username || !password || !name) {
    throw new Error(
      "必须设置 INIT_ADMIN_USERNAME、INIT_ADMIN_PASSWORD、INIT_ADMIN_NAME",
    );
  }

  if (username.length > 50 || name.length > 100) {
    throw new Error("用户名或姓名超过允许长度");
  }

  if (password.length < 12) {
    throw new Error("初始管理员密码至少需要 12 个字符");
  }

  if (username.trim() !== username || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    throw new Error(
      "用户名只能包含字母、数字、点、下划线和连字符，且不能有首尾空格",
    );
  }

  await db.$transaction(async (tx) => {
    const adminRole = await tx.role.upsert({
      where: { code: "ADMIN" },
      update: {},
      create: {
        code: "ADMIN",
        name: "系统管理员",
        description: "负责系统基础配置与管理",
      },
    });

    for (const item of permissions) {
      const permission = await tx.permission.upsert({
        where: { code: item.code },
        update: {},
        create: item,
      });

      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    const existingUser = await tx.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      console.log(`用户 ${username} 已存在，不修改其密码、状态或角色关联。`);
      return;
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const user = await tx.user.create({
      data: {
        username,
        passwordHash,
        name,
        status: "ACTIVE",
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    console.log(`初始管理员 ${username} 创建成功。`);
  });
}

main()
  .catch((error) => {
    console.error("系统初始化失败。", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
