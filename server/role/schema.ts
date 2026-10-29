import { z } from "zod";

const roleCodeSchema = z
  .string()
  .trim()
  .min(3, "角色编码至少需要 3 个字符")
  .max(50, "角色编码不能超过 50 个字符")
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    "角色编码必须以字母开头，只能包含字母、数字、下划线和连字符",
  )
  .transform((value) => value.toUpperCase());

export const createRoleSchema = z.object({
  code: roleCodeSchema,

  name: z
    .string()
    .trim()
    .min(2, "角色名称至少需要 2 个字符")
    .max(50, "角色名称不能超过 50 个字符"),

  description: z
    .string()
    .trim()
    .max(500, "角色描述不能超过 500 个字符")
    .transform((value) => value || null),

  status: z.enum(["ACTIVE", "DISABLED"]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  id: z.string().min(1, "角色 ID 不能为空"),

  name: z
    .string()
    .trim()
    .min(2, "角色名称至少需要 2 个字符")
    .max(50, "角色名称不能超过 50 个字符"),

  description: z
    .string()
    .trim()
    .max(500, "角色描述不能超过 500 个字符")
    .transform((value) => value || null),

  status: z.enum(["ACTIVE", "DISABLED"]),
});

export type UpdateRoleInput = z.infer<
  typeof updateRoleSchema
>;
