"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { updateRoleAction } from "@/server/role/actions";

export type EditableRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "DISABLED";
};

type Props = {
  role: EditableRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** 状态下拉选项：value 用内部枚举，label 用中文，按钮上显示中文 */
const statusItems = [
  { value: "ACTIVE", label: "启用" },
  { value: "DISABLED", label: "停用" },
];

export function EditRoleDialog({
  role,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 弹窗关闭时父组件会卸载本组件，重新打开时按最新的
  // role 初始化表单，这里无需再用 effect 同步 props。
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(
    role.description ?? "",
  );
  const [status, setStatus] = useState<
    "ACTIVE" | "DISABLED"
  >(role.status);

  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateRoleAction({
        id: role.id,
        name,
        description,
        status,
      });

      if (!result.success) {
        setMessage(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  function errorFor(field: string) {
    return fieldErrors[field]?.[0];
  }

  // 沿用项目现有 Base UI Dialog 的条件渲染约定。
  if (!open) return null;

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!pending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>
            修改角色名称、描述和状态。角色编码创建后不可修改。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-role-code">角色编码</Label>
            <Input
              id="edit-role-code"
              value={role.code}
              readOnly
              disabled
            />
            <p className="text-xs text-muted-foreground">
              角色编码用于系统识别，不支持在此处修改。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-name">角色名称 *</Label>
            <Input
              id="edit-role-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              aria-invalid={Boolean(errorFor("name"))}
              disabled={pending}
              required
            />
            {errorFor("name") && (
              <p className="text-sm text-destructive">
                {errorFor("name")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-description">
              角色描述
            </Label>
            <Textarea
              id="edit-role-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="描述角色的业务职责和使用场景"
              maxLength={500}
              disabled={pending}
              aria-invalid={Boolean(errorFor("description"))}
              className="min-h-24"
            />
            <p className="text-xs text-muted-foreground">
              最多 500 个字符。
            </p>
            {errorFor("description") && (
              <p className="text-sm text-destructive">
                {errorFor("description")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-status">角色状态</Label>
            <Select
              items={statusItems}
              value={status}
              onValueChange={(value) => {
                if (
                  value === "ACTIVE" ||
                  value === "DISABLED"
                ) {
                  setStatus(value);
                }
              }}
              disabled={pending}
            >
              <SelectTrigger
                id="edit-role-status"
                className="w-full"
              >
                <SelectValue placeholder="选择角色状态" />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {message && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>

            <Button type="submit" disabled={pending}>
              {pending ? "正在保存..." : "保存修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
