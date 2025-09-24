"use client";

import { useState } from "react";

export function ChipsInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const set = new Set(value);
    for (const p of parts) set.add(p);
    onChange(Array.from(set));
    setInput("");
  };

  const remove = (item: string) => {
    onChange(value.filter((v) => v !== item));
  };

  return (
    <div className={`rounded-lg border border-slate-700 bg-slate-800/60 p-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 text-xs text-slate-200 bg-slate-700/60 border border-slate-600 rounded-full px-2 py-1">
            {v}
            <button type="button" className="text-slate-300 hover:text-white ml-1" onClick={() => remove(v)} aria-label={`Remove ${v}`}>
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(input);
            } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
              // Quick remove last
              remove(value[value.length - 1]);
            }
          }}
          placeholder={placeholder}
          className="min-w-[10ch] flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500"
        />
      </div>
    </div>
  );
}
