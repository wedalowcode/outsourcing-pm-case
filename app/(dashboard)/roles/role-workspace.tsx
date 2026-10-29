"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { SearchBar } from "@/components/common/search-bar";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CreateRoleDialog } from "./_components/create-role-dialog";

type RoleStatus = "ACTIVE" | "DISABLED";

type RoleItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: RoleStatus;
  createdAt: Date;
  _count: {
    userRoles: number;
    rolePermissions: number;
  };
};

type RolePageData = {
  items: RoleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type RoleWorkspaceProps = {
  pageData: RolePageData;
  keyword: string;
  status: "" | RoleStatus;
};

export function RoleWorkspace({
  pageData,
  keyword,
  status,
}: RoleWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function go(next: {
    keyword?: string;
    status?: "" | RoleStatus;
    page?: number;
  }) {
    const nextKeyword = next.keyword ?? keyword;

    const nextStatus =
      next.status === undefined
        ? status
        : next.status;

    const nextPage = next.page ?? 1;

    const params = new URLSearchParams();

    if (nextKeyword) {
      params.set("keyword", nextKeyword);
    }

    if (nextStatus) {
      params.set("status", nextStatus);
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    const url = query ? `/roles?${query}` : "/roles";

    startTransition(() => {
      router.push(url);
    });
  }

  function handleStatusChange(value: string | null) {
    if (value === "全部状态") {
      go({ status: "", page: 1 });
      return;
    }

    if (value === "正常") {
      go({ status: "ACTIVE", page: 1 });
      return;
    }

    if (value === "已禁用") {
      go({ status: "DISABLED", page: 1 });
    }
  }

  function handleReset() {
    startTransition(() => {
      router.push("/roles");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            角色管理
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            查询和查看系统角色及其关联情况。
          </p>
        </div>

        <CreateRoleDialog />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          key={keyword}
          defaultValue={keyword}
          placeholder="搜索角色编码 / 名称 / 描述"
          onSearch={(value) =>
            go({ keyword: value, page: 1 })
          }
        />

        <Select
          value={
            status === "ACTIVE"
              ? "正常"
              : status === "DISABLED"
                ? "已禁用"
                : "全部状态"
          }
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="全部状态">
              全部状态
            </SelectItem>

            <SelectItem value="正常">
              正常
            </SelectItem>

            <SelectItem value="已禁用">
              已禁用
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleReset}
        >
          重置
        </Button>
      </div>

      <div
        className={
          isPending
            ? "overflow-hidden rounded-md border opacity-60"
            : "overflow-hidden rounded-md border"
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色编码</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead>角色描述</TableHead>
              <TableHead>用户数量</TableHead>
              <TableHead>权限数量</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageData.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  没有符合条件的角色
                </TableCell>
              </TableRow>
            ) : (
              pageData.items.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    {role.code}
                  </TableCell>

                  <TableCell>{role.name}</TableCell>

                  <TableCell>
                    {role.description || "—"}
                  </TableCell>

                  <TableCell>
                    {role._count.userRoles}
                  </TableCell>

                  <TableCell>
                    {role._count.rolePermissions}
                  </TableCell>

                  <TableCell>
                    <span
                      className={
                        role.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {role.status === "ACTIVE"
                        ? "正常"
                        : "已禁用"}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {new Date(
                      role.createdAt,
                    ).toLocaleString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={pageData.page}
        total={pageData.total}
        pageSize={pageData.pageSize}
        onChange={(page) => go({ page })}
      />
    </div>
  );
}
