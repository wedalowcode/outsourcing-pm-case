import { listUserPage } from "@/server/user/service";
import { UserWorkspace } from "./user-workspace";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    keyword?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const keyword = params.keyword?.trim() ?? "";

  const status =
    params.status === "ACTIVE" ||
    params.status === "DISABLED"
      ? params.status
      : undefined;

  const parsedPage = Number(params.page ?? "1");

  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const pageData = await listUserPage({
    keyword,
    status,
    page,
    pageSize: 10,
  });

  return (
    <UserWorkspace
      pageData={pageData}
      keyword={keyword}
      status={status ?? ""}
    />
  );
}
