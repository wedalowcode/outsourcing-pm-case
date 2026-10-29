import { z } from "zod";

const commonWeakPasswords = new Set([
  "password",
  "password123",
  "123456789012",
  "qwertyuiop12",
  "admin123456",
]);

export const passwordSchema = z
  .string()
  .min(12, "密码至少需要 12 个字符")
  .max(128, "密码不能超过 128 个字符")
  .refine(
    (password) => !commonWeakPasswords.has(password.toLowerCase()),
    "密码过于简单，请更换一个更安全的密码",
  );

const usernameSchema = z
  .string()
  .trim()
  .min(3, "用户名至少需要 3 个字符")
  .max(50, "用户名不能超过 50 个字符")
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    "用户名必须以字母开头，只能包含字母、数字、下划线和连字符",
  );

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255, "邮箱不能超过 255 个字符")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "邮箱格式不正确",
  )
  .transform((value) => value || null);

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30, "手机号不能超过 30 个字符")
  .refine(
    (value) => value === "" || /^\+?[0-9 ()-]{7,30}$/.test(value),
    "手机号格式不正确",
  )
  .transform((value) => value || null);

export const createUserSchema = z
  .object({
    username: usernameSchema,
    name: z.string().trim().min(1, "请输入姓名").max(100),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    status: z.enum(["ACTIVE", "DISABLED"]),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "两次输入的密码不一致",
      path: ["confirmPassword"],
    },
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
