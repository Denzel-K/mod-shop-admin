"use client";

import { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { linter } from '@codemirror/lint';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

export function JsonEditor({ 
  value, 
  onChange, 
  placeholder = '{}',
  readOnly = false,
  height = '300px'
}: JsonEditorProps) {
  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  const extensions = useMemo(() => [
    json(),
    linter(jsonParseLinter()),
    keymap.of([indentWithTab]),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        maxHeight: '600px',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: height,
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '6px',
        maxHeight: '600px',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        maxHeight: '600px',
        overflow: 'auto',
      },
      '.cm-diagnostic-error': {
        borderBottom: '2px wavy #ef4444',
      },
      '.cm-diagnostic-warning': {
        borderBottom: '2px wavy #f59e0b',
      },
      '.cm-lint-marker-error': {
        backgroundColor: '#ef4444',
      },
      '.cm-lint-marker-warning': {
        backgroundColor: '#f59e0b',
      },
      '.cm-tooltip.cm-tooltip-lint': {
        backgroundColor: '#1e293b',
        border: '1px solid #475569',
        borderRadius: '6px',
        color: '#f1f5f9',
      },
    }),
    EditorView.lineWrapping,
  ], [height]);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
      <CodeMirror
        value={value}
        onChange={handleChange}
        theme={oneDark}
        extensions={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          searchKeymap: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
