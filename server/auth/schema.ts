import "server-only";

import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "请输入用户名")
    .max(50, "用户名不能超过 50 个字符")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "用户名只能包含字母、数字、点、下划线和连字符",
    ),

  password: z
    .string()
    .min(1, "请输入密码")
    .max(1024, "密码长度不能超过 1024 个字符"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
