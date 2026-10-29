import { listRoles } from "@/server/role/service";
import { RoleWorkspace } from "./role-workspace";

export const dynamic = "force-dynamic";

type SearchParams = {
  keyword?: string | string[];
  status?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function firstValue(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(
  value: string | undefined,
  fallback: number,
) {
  if (!value || !/^\d+$/.test(value)) {
    return fallback;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0
    ? number
    : fallback;
}

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const keyword =
    firstValue(params.keyword)?.trim().slice(0, 100) ?? "";

  const rawStatus = firstValue(params.status);

  const status =
    rawStatus === "ACTIVE" ||
    rawStatus === "DISABLED"
      ? rawStatus
      : "";

  const page = positiveInteger(
    firstValue(params.page),
    1,
  );

  const pageSize = Math.min(
    positiveInteger(firstValue(params.pageSize), 10),
    100,
  );

  const pageData = await listRoles({
    keyword,
    status: status || "ALL",
    page,
    pageSize,
  });

  return (
    <RoleWorkspace
      pageData={pageData}
      keyword={keyword}
      status={status}
    />
  );
}
