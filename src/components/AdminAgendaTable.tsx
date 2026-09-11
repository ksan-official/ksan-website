"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type AgendaRow = {
  id: string;
  label: string;
  time: string;
};

function parseInitialRows(value: string | null | undefined): AgendaRow[] {
  const rows = (value ?? "")
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("|");
      const time = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : "";
      const label = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : line;
      return { id: crypto.randomUUID(), label, time };
    });

  return rows.length ? rows : [{ id: crypto.randomUUID(), label: "", time: "" }];
}

export function AdminAgendaTable({ defaultValue = "", disabled = false }: { defaultValue?: string | null; disabled?: boolean }) {
  const [rows, setRows] = useState<AgendaRow[]>(() => parseInitialRows(defaultValue));
  const serializedAgenda = useMemo(
    () => rows
      .map((row) => {
        const time = row.time.trim();
        const label = row.label.trim();
        if (!time && !label) return "";
        return time ? `${time} | ${label}` : label;
      })
      .filter(Boolean)
      .join("\n"),
    [rows]
  );

  function updateRow(id: string, field: "label" | "time", value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  }

  function addRow() {
    setRows((current) => [...current, { id: crypto.randomUUID(), label: "", time: "" }]);
  }

  function removeRow(id: string) {
    setRows((current) => current.length > 1 ? current.filter((row) => row.id !== id) : [{ id: crypto.randomUUID(), label: "", time: "" }]);
  }

  return (
    <div className="field admin-agenda-field">
      <span>행사 일정</span>
      <input name="agendaText" type="hidden" value={serializedAgenda} />
      <div className="admin-agenda-table">
        <div aria-hidden className="admin-agenda-header">
          <span>시간</span>
          <span>내용</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div className="admin-agenda-row" key={row.id}>
            <input
              aria-label={`${index + 1}번째 일정 시간`}
              disabled={disabled}
              onChange={(event) => updateRow(row.id, "time", event.target.value)}
              placeholder="16:20-16:30"
              value={row.time}
            />
            <input
              aria-label={`${index + 1}번째 일정 내용`}
              disabled={disabled}
              onChange={(event) => updateRow(row.id, "label", event.target.value)}
              placeholder="개회식"
              value={row.label}
            />
            <button aria-label={`${index + 1}번째 일정 삭제`} disabled={disabled} onClick={() => removeRow(row.id)} type="button">
              <Trash2 aria-hidden size={16} />
            </button>
          </div>
        ))}
        <button className="admin-agenda-add" disabled={disabled} onClick={addRow} type="button">
          <Plus aria-hidden size={16} />일정 추가
        </button>
      </div>
    </div>
  );
}
