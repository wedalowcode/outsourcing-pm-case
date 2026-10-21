"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { loginAction } from "@/server/auth/actions";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type LoginFormValues = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError("");

    try {
      const result = await loginAction(values);

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      router.replace("/dept");
      router.refresh();
    } catch {
      setSubmitError("登录失败，请稍后重试");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            外包项目管理平台
          </CardTitle>

          <CardDescription>
            请输入账号和密码，登录系统
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="username">
                用户名
              </Label>

              <Input
                id="username"
                autoComplete="username"
                placeholder="请输入用户名"
                aria-invalid={!!errors.username}
                aria-describedby={
                  errors.username
                    ? "username-error"
                    : undefined
                }
                {...register("username", {
                  required: "请输入用户名",
                  maxLength: {
                    value: 50,
                    message: "用户名不能超过 50 个字符",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9._-]+$/,
                    message:
                      "用户名只能包含字母、数字、点、下划线和连字符",
                  },
                })}
              />

              {errors.username && (
                <p
                  id="username-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                密码
              </Label>

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password
                    ? "password-error"
                    : undefined
                }
                {...register("password", {
                  required: "请输入密码",
                  maxLength: {
                    value: 1024,
                    message:
                      "密码长度不能超过 1024 个字符",
                  },
                })}
              />

              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {submitError && (
              <p
                className="text-sm text-destructive"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "验证中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
