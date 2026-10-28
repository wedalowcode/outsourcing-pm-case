"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  defaultValue: string;
  placeholder?: string;
  onSearch: (keyword: string) => void;
};

export function SearchBar({
  defaultValue,
  placeholder = "请输入关键字",
  onSearch,
}: SearchBarProps) {
  const [draft, setDraft] = useState(defaultValue);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    onSearch(draft.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md items-center gap-2"
    >
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
      />

      <Button type="submit" variant="outline">
        查询
      </Button>
    </form>
  );
}
