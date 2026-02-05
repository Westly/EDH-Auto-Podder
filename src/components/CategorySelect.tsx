import React from "react";
import { Category } from "../state/model";

export function CategorySelect({
  categories,
  value,
  onChange
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const selected = categories.find(c => c.categoryId === value);

  return (
    <select
      className="categorySelect"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={
        selected
          ? {
              borderColor: selected.color,
              boxShadow: `0 0 0 1px ${selected.color}33`,
              color: selected.color
            }
          : undefined
      }
    >
      {categories
        .slice()
        .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
        .map(c => (
          <option key={c.categoryId} value={c.categoryId} style={{ color: c.color }}>
            Bracket {c.rank} — {c.name}
          </option>
        ))}
    </select>
  );
}
