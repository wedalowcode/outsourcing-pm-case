"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = {
  value: string;
  label: string;
};

/** 统一的下拉选择封装，省去重复的 trigger / content 结构 */
export function OptionSelect({
  items,
  value,
  onChange,
}: {
  items: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(String(next))}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
