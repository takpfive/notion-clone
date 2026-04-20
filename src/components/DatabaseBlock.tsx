import { useState } from "react";
import { nanoid } from "nanoid";
import type { DbColumn, DbColumnType, DbData, DbRow } from "../types";
import { IMEInput } from "./IMEInput";

interface Props {
  data: DbData;
  onChange: (next: DbData) => void;
}

const TYPE_LABELS: Record<DbColumnType, string> = {
  text: "テキスト",
  number: "数値",
  select: "選択",
  checkbox: "チェック",
  date: "日付",
};

export function DatabaseBlock({ data, onChange }: Props) {
  const [editingCol, setEditingCol] = useState<string | null>(null);

  const updateTitle = (title: string) => onChange({ ...data, title });

  const updateCol = (id: string, patch: Partial<DbColumn>) =>
    onChange({ ...data, columns: data.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const addCol = () => {
    const col: DbColumn = { id: nanoid(6), name: "新規列", type: "text" };
    onChange({
      ...data,
      columns: [...data.columns, col],
      rows: data.rows.map((r) => ({ ...r, cells: { ...r.cells, [col.id]: "" } })),
    });
  };

  const deleteCol = (id: string) => {
    if (data.columns.length <= 1) return;
    onChange({
      ...data,
      columns: data.columns.filter((c) => c.id !== id),
      rows: data.rows.map((r) => {
        const { [id]: _, ...rest } = r.cells;
        return { ...r, cells: rest };
      }),
    });
  };

  const addRow = () => {
    const cells: Record<string, string | boolean> = {};
    data.columns.forEach((c) => (cells[c.id] = c.type === "checkbox" ? false : ""));
    const row: DbRow = { id: nanoid(6), cells };
    onChange({ ...data, rows: [...data.rows, row] });
  };

  const deleteRow = (id: string) => onChange({ ...data, rows: data.rows.filter((r) => r.id !== id) });

  const updateCell = (rowId: string, colId: string, value: string | boolean) =>
    onChange({
      ...data,
      rows: data.rows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r)),
    });

  return (
    <div className="db-block">
      <div className="db-title-row">
        <span className="db-title-icon">▦</span>
        <IMEInput
          className="db-title"
          value={data.title}
          onChange={updateTitle}
          placeholder="無題のデータベース"
        />
      </div>
      <div className="db-scroll">
        <table className="db-table">
          <thead>
            <tr>
              {data.columns.map((col) => (
                <th key={col.id} className="db-th">
                  <div className="db-th-inner" onClick={() => setEditingCol(editingCol === col.id ? null : col.id)}>
                    <span className="db-col-type">{columnIcon(col.type)}</span>
                    <IMEInput
                      className="db-col-name"
                      value={col.name}
                      onChange={(v) => updateCol(col.id, { name: v })}
                      placeholder="列名"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="db-col-caret">▾</span>
                  </div>
                  {editingCol === col.id && (
                    <div className="db-col-menu" onMouseLeave={() => setEditingCol(null)}>
                      <div className="db-col-menu-section">タイプ</div>
                      {(Object.keys(TYPE_LABELS) as DbColumnType[]).map((t) => (
                        <div
                          key={t}
                          className={`db-col-menu-item ${col.type === t ? "active" : ""}`}
                          onClick={() => {
                            updateCol(col.id, { type: t, options: t === "select" ? col.options ?? ["A", "B", "C"] : undefined });
                            setEditingCol(null);
                          }}
                        >
                          {columnIcon(t)} {TYPE_LABELS[t]}
                        </div>
                      ))}
                      <div className="db-col-menu-sep" />
                      <div
                        className="db-col-menu-item danger"
                        onClick={() => {
                          deleteCol(col.id);
                          setEditingCol(null);
                        }}
                      >
                        🗑 列を削除
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className="db-th db-th-add">
                <button className="db-add-col-btn" onClick={addCol}>＋</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="db-row">
                {data.columns.map((col) => (
                  <td key={col.id} className="db-td">
                    <Cell
                      col={col}
                      value={row.cells[col.id]}
                      onChange={(v) => updateCell(row.id, col.id, v)}
                    />
                  </td>
                ))}
                <td className="db-td db-td-actions">
                  <button className="db-row-del-btn" title="行を削除" onClick={() => deleteRow(row.id)}>×</button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="db-td db-add-row" colSpan={data.columns.length + 1} onClick={addRow}>
                ＋ 新規
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="db-count">{data.rows.length} 件</div>
    </div>
  );
}

function columnIcon(type: DbColumnType): string {
  switch (type) {
    case "text": return "A";
    case "number": return "#";
    case "select": return "▾";
    case "checkbox": return "☑";
    case "date": return "📅";
  }
}

function Cell({
  col,
  value,
  onChange,
}: {
  col: DbColumn;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  if (col.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (col.type === "select") {
    const options = col.options ?? [];
    return (
      <select className="db-cell-select" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value=""></option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (col.type === "date") {
    return (
      <input
        type="date"
        className="db-cell-input"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (col.type === "number") {
    return (
      <IMEInput
        className="db-cell-input db-cell-number"
        value={String(value ?? "")}
        onChange={onChange}
        inputMode="numeric"
      />
    );
  }
  return (
    <IMEInput
      className="db-cell-input"
      value={String(value ?? "")}
      onChange={onChange}
    />
  );
}
