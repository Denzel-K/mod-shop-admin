"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function normalize(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function ComboBox({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  emptyText = "No matches",
  label,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  emptyText?: string;
  label?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setInput(value || ""), [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(input);
    if (!q) return options.slice(0, 50);
    return options
      .map((opt) => ({ opt, score: normalize(opt).includes(q) ? 1 : 0 }))
      .filter((o) => o.score > 0)
      .slice(0, 50)
      .map((o) => o.opt);
  }, [input, options]);

  const select = (val: string) => {
    onChange(val);
    setInput(val);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label htmlFor={id} className="sr-only">{label}</label>
      )}
      <input
        id={id}
        value={input}
        onChange={(e) => { setInput(e.target.value); setOpen(true); onChange(e.target.value); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter') setOpen(false);
        }}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2 placeholder-slate-500"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-40 mt-1 w-full max-h-56 overflow-auto rounded-md border border-slate-700 bg-slate-900 shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">{emptyText}</div>
          ) : (
            filtered.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => select(opt)}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-800 ${opt === value ? 'text-cyan-300' : 'text-slate-200'}`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
