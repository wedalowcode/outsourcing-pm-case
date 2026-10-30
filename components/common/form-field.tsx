import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** 标签 + 控件的固定结构，保证各表单项间距一致 */
export function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
