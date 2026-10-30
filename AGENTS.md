<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# 项目说明

后台管理系统（部门 / 角色 / 用户 / 登录鉴权）。
技术栈：Next.js (App Router) + TypeScript + Prisma + Zod + shadcn/ui + pnpm。

## 常用命令

- `pnpm dev`：启动开发
- `pnpm test`：运行测试
- `pnpm lint`：代码检查
- `pnpm prisma generate`：修改 schema 后重新生成客户端
- `pnpm prisma migrate dev`：创建并应用迁移

## 目录约定

- `app/`：只放路由、页面、layout，保持"薄"，不写业务逻辑
- `app/(dashboard)/<module>/_components/`：该页面专属组件
- `components/{ui,common,layout}`：跨页面复用组件，`ui` 为 shadcn，勿手改
- `server/<module>/`：业务层，按领域划分（auth / dept / role / user）
- `lib/`：prisma 单例、通用校验、`biz-error.ts` 等基础设施
- `tests/`：镜像 `server/` 的目录结构

## server 模块规范

每个模块必选：

- `actions.ts`：Server Action 入口，只做 鉴权 → 校验 → 调 service → 返回结果，不写业务
- `service.ts`：业务逻辑与数据库访问
- `schema.ts`：Zod 校验，输入类型用 `z.infer` 导出

按需添加（有真实需求才建，不建空文件）：

- `types.ts`：被多处或客户端组件引用的 DTO 类型
- `mappers.ts`：DB 模型 → DTO 转换（隐藏字段、Date 序列化）

## 编码约定

- 业务错误统一抛 `BizError`（`lib/biz-error.ts`），不要直接抛字符串
- 所有 Server Action 入参必须经过 Zod 校验
- 文件名 kebab-case；目录已表明模块，文件名不再加模块前缀（用 `utils.ts`，不要 `dept-utils.ts`）
- 新增或修改业务逻辑时，同步在 `tests/server/<module>/` 补测试

## 安全红线

- 任何接口、Action 的返回值不得包含 `password` 等敏感字段
- 所有写操作和敏感读操作必须校验登录态与权限
- 不要读取、输出或提交 `.env`

## 禁止事项

- 不要手动修改 `lib/generated/`（Prisma 生成物）和 `components/ui/`
- 不要在 `app/` 下的页面里直接调用 Prisma
- 不要为了目录整齐创建空的 `types.ts` / `mappers.ts`
- 不要引入新依赖，除非先说明理由