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

import { CreateUserDialog } from "./_components/create-user-dialog";

type UserStatus = "ACTIVE" | "DISABLED";

type UserItem = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  createdAt: Date;
};

type UserPageData = {
  items: UserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type UserWorkspaceProps = {
  pageData: UserPageData;
  keyword: string;
  status: "" | UserStatus;
};

export function UserWorkspace({
  pageData,
  keyword,
  status,
}: UserWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function go(next: {
    keyword?: string;
    status?: "" | UserStatus;
    page?: number;
  }) {
    const nextKeyword = next.keyword ?? keyword;
    const nextStatus =
      next.status === undefined ? status : next.status;
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
    const url = query ? `/users?${query}` : "/users";

    startTransition(() => {
      router.push(url);
    });
  }

  function handleStatusChange(value: string | null) {
    // SelectItem 的 value 全部使用中文，按钮上始终显示中文标签；
    // 这里把中文值映射回内部状态供 URL 和 Service 使用。
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
      router.push("/users");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">用户管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查询和查看系统用户信息。
          </p>
        </div>

        <CreateUserDialog />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          key={keyword}
          defaultValue={keyword}
          placeholder="搜索用户名 / 姓名 / 邮箱"
          onSearch={(value) =>
            go({ keyword: value, page: 1 })
          }
        />

        <Select
          value={status === "ACTIVE" ? "正常" : status === "DISABLED" ? "已禁用" : "全部状态"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="全部状态">全部状态</SelectItem>
            <SelectItem value="正常">正常</SelectItem>
            <SelectItem value="已禁用">已禁用</SelectItem>
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
              <TableHead>用户名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageData.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  没有符合条件的用户
                </TableCell>
              </TableRow>
            ) : (
              pageData.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                  </TableCell>

                  <TableCell>{user.name}</TableCell>

                  <TableCell>
                    {user.email || "—"}
                  </TableCell>

                  <TableCell>
                    {user.phone || "—"}
                  </TableCell>

                  <TableCell>
                    <span
                      className={
                        user.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {user.status === "ACTIVE"
                        ? "正常"
                        : "已禁用"}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {new Date(
                      user.createdAt
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
