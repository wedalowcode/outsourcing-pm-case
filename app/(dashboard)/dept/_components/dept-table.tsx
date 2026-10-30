import { DEPT_STATUS, type Row } from "@/server/dept/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLUMNS = ["编码", "部门名称", "上级部门", "排序", "状态", "操作"];

export function DeptTable({
  rows,
  emptyText,
  onEdit,
  onDelete,
}: {
  rows: Row[];
  emptyText: string; // 空状态文案由父组件决定，表格不关心业务
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={COLUMNS.length}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const enabled = row.status === DEPT_STATUS.ENABLED;

            return (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.code}
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.parentName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.sort}
                </TableCell>
                <TableCell>
                  <Badge variant={enabled ? "secondary" : "outline"}>
                    {enabled ? "启用" : "停用"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(row)}
                    >
                      编辑
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(row)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
