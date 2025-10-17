"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyValueInputProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  placeholder?: {
    key?: string;
    value?: string;
  };
  className?: string;
  onPendingChange?: (pending: boolean) => void;
}

export function KeyValueInput({ 
  value, 
  onChange, 
  placeholder = { key: "Surface name", value: "Technical identifier" },
  className,
  onPendingChange,
}: KeyValueInputProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const addPair = () => {
    if (newKey.trim() && newValue.trim() && !value[newKey.trim()]) {
      onChange({
        ...value,
        [newKey.trim()]: newValue.trim()
      });
      setNewKey("");
      setNewValue("");
      onPendingChange?.(false);
    }
  };

  const removePair = (key: string) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
  };

  const updatePair = (oldKey: string, newKey: string, newVal: string) => {
    if (newKey.trim() && newVal.trim()) {
      const updated = { ...value };
      delete updated[oldKey];
      updated[newKey.trim()] = newVal.trim();
      onChange(updated);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPair();
    }
  };

  // Track pending state: when either input has text but not yet added
  const pending = !!(newKey.trim() || newValue.trim());
  // Notify parent when pending state changes (avoid setState during render)
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Existing pairs */}
      {Object.entries(value).map(([key, val]) => (
        <div key={key} className="flex gap-2 items-center">
          <Input
            value={key}
            onChange={(e) => updatePair(key, e.target.value, val)}
            placeholder={placeholder.key}
            className="flex-1 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500"
          />
          <span className="text-slate-400 text-sm">→</span>
          <Input
            value={val}
            onChange={(e) => updatePair(key, key, e.target.value)}
            placeholder={placeholder.value}
            className="flex-1 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removePair(key)}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* Add new pair */}
      <div className="flex gap-2 items-center border-t border-slate-700/50 pt-3">
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={placeholder.key}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500"
        />
        <span className="text-slate-400 text-sm">→</span>
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={placeholder.value}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 font-mono text-xs"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addPair}
          disabled={!newKey.trim() || !newValue.trim() || !!value[newKey.trim()]}
          className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 px-2 h-8 disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">Add</span>
        </Button>
      </div>

      {Object.keys(value).length === 0 && (
        <div className="text-xs text-slate-500 text-center py-2">
          No surface mappings defined. Add key-value pairs above.
        </div>
      )}
    </div>
  );
}

