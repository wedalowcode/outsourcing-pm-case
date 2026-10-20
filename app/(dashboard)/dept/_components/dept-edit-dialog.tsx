"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DeptStatus, TreeNode } from "@/server/dept/types";

/** 上级部门下拉里代表“无（顶级部门）”的哨兵值 */
const ROOT_OPTION = "__ROOT__";

/** 新增、编辑共用的表单数据类型 */
export type DeptForm = {
  name: string;
  code: string;
  parentId: string | null;
  sort: string;
  status: DeptStatus;
  description: string;
};

/** 新增模式下的默认表单值 */
export function emptyForm(parentId: string | null): DeptForm {
  return {
    name: "",
    code: "",
    parentId,
    sort: "",
    status: 1,
    description: "",
  };
}

type DeptEditDialogProps = {
  mode: "create" | "edit";
  initial: DeptForm;
  tree: TreeNode[];
  excludeIds: string[];
  error: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (form: DeptForm) => void;
};

type FlatOption = {
  id: string;
  label: string;
};

/** 把部门树拍平成下拉选项，缩进体现层级，并跳过被排除的部门 */
function flattenTree(
  nodes: TreeNode[],
  excludeIds: string[],
  depth = 0
): FlatOption[] {
  const options: FlatOption[] = [];

  for (const node of nodes) {
    if (excludeIds.includes(node.id)) continue;

    options.push({
      id: node.id,
      label: `${"　".repeat(depth)}${node.name}`,
    });

    options.push(
      ...flattenTree(node.children, excludeIds, depth + 1)
    );
  }

  return options;
}

export function DeptEditDialog({
  mode,
  initial,
  tree,
  excludeIds,
  error,
  submitting,
  onClose,
  onSubmit,
}: DeptEditDialogProps) {
  const [form, setForm] = useState<DeptForm>(initial);
  const [localError, setLocalError] = useState("");

  const parentOptions = flattenTree(tree, excludeIds);

  const parentItems = [
    { value: ROOT_OPTION, label: "无（顶级部门）" },
    ...parentOptions.map((option) => ({
      value: option.id,
      label: option.label,
    })),
  ];

  const statusItems = [
    { value: "1", label: "启用" },
    { value: "0", label: "停用" },
  ];

  function setField<K extends keyof DeptForm>(
    key: K,
    value: DeptForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // 客户端只做最基本的校验：必填、排序是整数。
  // 部门名称重复、上级是否合法等业务规则由服务端判断。
  function handleSave() {
    if (!form.name.trim()) {
      setLocalError("请填写部门名称");
      return;
    }

    if (
      form.sort.trim() &&
      !Number.isInteger(Number(form.sort))
    ) {
      setLocalError("排序必须是整数");
      return;
    }

    setLocalError("");
    onSubmit(form);
  }

  const message = localError || error;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "新增部门" : "编辑部门"}
          </DialogTitle>
          <DialogDescription>
            部门编码由系统自动生成，不需要手工填写。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              部门名称
            </label>
            <Input
              value={form.name}
              placeholder="例如：研发部"
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              部门编码
            </label>
            <Input
              value={form.code}
              placeholder="保存后自动生成"
              readOnly
              className="bg-muted/50 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              上级部门
            </label>
            <Select
              items={parentItems}
              value={form.parentId ?? ROOT_OPTION}
              onValueChange={(value) =>
                setField(
                  "parentId",
                  value === ROOT_OPTION ? null : String(value)
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parentItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                排序
              </label>
              <Input
                value={form.sort}
                placeholder="留空则自动排到末尾"
                inputMode="numeric"
                onChange={(e) => setField("sort", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                状态
              </label>
              <Select
                items={statusItems}
                value={String(form.status)}
                onValueChange={(value) =>
                  setField("status", value === "1" ? 1 : 0)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              部门描述
            </label>
            <Textarea
              value={form.description}
              placeholder="选填，最多 500 字"
              rows={3}
              onChange={(e) =>
                setField("description", e.target.value)
              }
            />
          </div>
        </div>

        {message ? (
          <p className="text-sm text-destructive">{message}</p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={onClose}
          >
            取消
          </Button>
          <Button disabled={submitting} onClick={handleSave}>
            {submitting ? "保存中…" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
