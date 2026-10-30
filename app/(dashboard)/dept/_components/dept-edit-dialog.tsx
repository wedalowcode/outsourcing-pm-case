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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/form-field";
import { OptionSelect } from "@/components/common/option-select";
import type {
  DeptInput,
  DeptStatus,
  Row,
  TreeNode,
} from "@/server/dept/types";

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

/** 表格行 → 表单值（编辑弹窗回显） */
export function toForm(row: Row): DeptForm {
  return {
    name: row.name,
    code: row.code,
    parentId: row.parentId,
    sort: String(row.sort),
    status: row.status === 1 ? 1 : 0,
    description: row.description ?? "",
  };
}

/** 表单值 → Action 入参 */
export function toDeptInput(form: DeptForm): DeptInput {
  return {
    name: form.name.trim(),
    parentId: form.parentId,
    sort: form.sort.trim() ? Number(form.sort) : undefined,
    status: form.status,
    description: form.description.trim(),
  };
}

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
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: DeptForm;
  tree: TreeNode[];
  excludeIds: string[];
  onClose: () => void;
  /** 返回错误文案表示失败，返回 undefined 表示成功（由父组件卸载弹窗） */
  onSubmit: (form: DeptForm) => Promise<string | undefined>;
}) {
  const [form, setForm] = useState<DeptForm>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    // 客户端只做最基本的校验：必填、排序是整数。
    // 名称重复、上级是否合法等业务规则由服务端判断。
    if (!form.name.trim()) {
      setError("请填写部门名称");
      return;
    }

    if (form.sort.trim() && !Number.isInteger(Number(form.sort))) {
      setError("排序必须是整数");
      return;
    }

    setSubmitting(true);
    setError("");

    const message = await onSubmit(form).catch(
      () => "保存失败，请稍后重试"
    );

    setSubmitting(false);

    if (message) setError(message);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // 提交中不允许通过 Esc 或点击遮罩关闭，避免中途打断请求
        if (!open && !submitting) onClose();
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <FormField label="部门名称" htmlFor="dept-name">
            <Input
              id="dept-name"
              value={form.name}
              placeholder="例如：研发部"
              disabled={submitting}
              onChange={(event) => setField("name", event.target.value)}
            />
          </FormField>

          <FormField label="部门编码" htmlFor="dept-code">
            <Input
              id="dept-code"
              value={form.code}
              placeholder="保存后自动生成"
              readOnly
              className="bg-muted/50 font-mono"
            />
          </FormField>

          <FormField label="上级部门">
            <OptionSelect
              items={parentItems}
              value={form.parentId ?? ROOT_OPTION}
              onChange={(value) =>
                setField(
                  "parentId",
                  value === ROOT_OPTION ? null : value
                )
              }
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="排序" htmlFor="dept-sort">
              <Input
                id="dept-sort"
                value={form.sort}
                placeholder="留空则自动排到末尾"
                inputMode="numeric"
                disabled={submitting}
                onChange={(event) => setField("sort", event.target.value)}
              />
            </FormField>

            <FormField label="状态">
              <OptionSelect
                items={statusItems}
                value={String(form.status)}
                onChange={(value) =>
                  setField("status", value === "1" ? 1 : 0)
                }
              />
            </FormField>
          </div>

          <FormField label="部门描述" htmlFor="dept-description">
            <Textarea
              id="dept-description"
              value={form.description}
              placeholder="选填，最多 500 字"
              rows={3}
              disabled={submitting}
              onChange={(event) =>
                setField("description", event.target.value)
              }
            />
          </FormField>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
