-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN "status" "RoleStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
-- Permission 表已有历史数据，直接添加非空列会失败。
-- 因此先以可空方式加列，回填后再收紧为非空。
ALTER TABLE "Permission" ADD COLUMN "resource" VARCHAR(50),
ADD COLUMN "action" VARCHAR(50);

-- 回填：权限编码遵循「资源:操作」的约定，历史数据按冒号拆分
UPDATE "Permission"
SET "resource" = split_part("code", ':', 1),
    "action" = split_part("code", ':', 2)
WHERE "resource" IS NULL OR "action" IS NULL;

-- 不符合「资源:操作」格式的历史数据统一归入 unknown，避免迁移中断
UPDATE "Permission"
SET "resource" = COALESCE(NULLIF("resource", ''), 'unknown'),
    "action" = COALESCE(NULLIF("action", ''), 'unknown');

ALTER TABLE "Permission"
ALTER COLUMN "resource" SET NOT NULL,
ALTER COLUMN "action" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "Role_status_idx" ON "Role"("status");
