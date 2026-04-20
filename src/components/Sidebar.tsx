import { useState } from "react";
import type { AppState, Page } from "../types";

interface Props {
  state: AppState;
  onSelect: (id: string) => void;
  onAddRoot: () => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export function Sidebar({ state, onSelect, onAddRoot, onAddChild, onDelete, onToggleExpand }: Props) {
  const rootPages = state.rootOrder.map((id) => state.pages[id]).filter(Boolean);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">📒 My Notion</div>
      <div className="sidebar-tree">
        {rootPages.map((p) => (
          <TreeNode
            key={p.id}
            page={p}
            depth={0}
            state={state}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onDelete={onDelete}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-add-btn" onClick={onAddRoot}>＋ 新規ページ</button>
      </div>
    </aside>
  );
}

interface NodeProps {
  page: Page;
  depth: number;
  state: AppState;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

function TreeNode({ page, depth, state, onSelect, onAddChild, onDelete, onToggleExpand }: NodeProps) {
  const children = Object.values(state.pages).filter((p) => p.parentId === page.id);
  const expanded = state.expandedIds.includes(page.id);
  const active = state.activePageId === page.id;
  const [hovering, setHovering] = useState(false);

  return (
    <div>
      <div
        className={`tree-item ${active ? "active" : ""}`}
        style={{ paddingLeft: 4 + depth * 14 }}
        onClick={() => onSelect(page.id)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <span
          className={`tree-caret ${expanded ? "expanded" : ""} ${children.length === 0 ? "empty" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (children.length > 0) onToggleExpand(page.id);
          }}
        >
          ▶
        </span>
        <span className="tree-icon">{page.icon}</span>
        <span className="tree-title">{page.title || "無題"}</span>
        {hovering && (
          <span className="tree-actions">
            <button
              className="tree-action-btn"
              title="削除"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`「${page.title || "無題"}」を削除しますか？子ページも削除されます。`)) {
                  onDelete(page.id);
                }
              }}
            >
              🗑
            </button>
            <button
              className="tree-action-btn"
              title="サブページを追加"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(page.id);
              }}
            >
              ＋
            </button>
          </span>
        )}
      </div>
      {expanded &&
        children.map((c) => (
          <TreeNode
            key={c.id}
            page={c}
            depth={depth + 1}
            state={state}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onDelete={onDelete}
            onToggleExpand={onToggleExpand}
          />
        ))}
    </div>
  );
}
