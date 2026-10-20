import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "请输入用户名")
    .max(50, "用户名长度不能超过 50 个字符")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "用户名格式不正确",
    ),

  password: z
    .string()
    .min(1, "请输入密码")
    .max(1024, "密码长度超出允许范围"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
