"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";

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

export default function LoginPage() {
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError("");

    // 本节只验证表单数据。
    // 下一节再接入真正的登录认证接口。
    console.log("表单校验通过", {
      username: values.username,
    });

    setSubmitError(
      "表单校验已通过，登录认证接口将在下一节接入。",
    );
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
                {...register("username")}
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
                {...register("password")}
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
              {isSubmitting ? "正在提交..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
