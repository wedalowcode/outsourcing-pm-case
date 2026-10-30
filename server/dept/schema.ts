import { z } from "zod";

/** 部门状态：0 停用，1 启用 */
export const DeptStatusSchema = z.union([
  z.literal(0),
  z.literal(1),
]);

/** 与 DeptStatusSchema 对应的 TypeScript 类型 */
export type DeptStatus = z.infer<typeof DeptStatusSchema>;

/** 部门新增、编辑共用的输入规则 */
export const DeptInputSchema = z.object({
  name: z
    .string({
      error: "部门名称必须是字符串",
    })
    .trim()
    .min(1, "请填写部门名称")
    .max(50, "部门名称不能超过 50 个字"),

  parentId: z
    .string()
    .min(1, "上级部门 ID 不能为空")
    .nullable(),

  sort: z
    .number()
    .int("排序必须是整数")
    .optional(),

  status: DeptStatusSchema.optional(),

  description: z
    .string()
    .trim()
    .max(500, "部门描述不能超过 500 个字")
    .optional(),
});

/** 从 Schema 自动推导 TypeScript 类型 */
export type DeptInput = z.infer<typeof DeptInputSchema>;

/**
 * 列表页查询参数。
 *
 * searchParams 的值可能被重复拼接成数组（?keyword=a&keyword=b），
 * 这里统一降级成安全默认值，避免后续调用字符串方法时抛错。
 */
export const DeptQuerySchema = z.object({
  keyword: z.string().trim().catch(""),
  parent: z.string().min(1).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});
