import { useEffect, useRef } from "react";
import type { BlockType } from "../types";

export interface SlashItem {
  type: BlockType;
  label: string;
  desc: string;
  icon: string;
  keywords: string[];
}

export const SLASH_ITEMS: SlashItem[] = [
  { type: "paragraph", label: "テキスト", desc: "プレーンテキスト", icon: "¶", keywords: ["text", "paragraph", "テキスト"] },
  { type: "h1", label: "見出し1", desc: "大見出し", icon: "H1", keywords: ["h1", "heading", "見出し"] },
  { type: "h2", label: "見出し2", desc: "中見出し", icon: "H2", keywords: ["h2", "heading", "見出し"] },
  { type: "h3", label: "見出し3", desc: "小見出し", icon: "H3", keywords: ["h3", "heading", "見出し"] },
  { type: "todo", label: "To-Do", desc: "チェックボックス付き", icon: "☑", keywords: ["todo", "check", "タスク"] },
  { type: "bullet", label: "箇条書きリスト", desc: "シンプルなリスト", icon: "•", keywords: ["bullet", "list", "リスト"] },
  { type: "numbered", label: "番号付きリスト", desc: "1. 2. 3.", icon: "1.", keywords: ["numbered", "ol", "番号"] },
  { type: "quote", label: "引用", desc: "引用ブロック", icon: "❝", keywords: ["quote", "引用"] },
  { type: "callout", label: "コールアウト", desc: "注目させたい内容", icon: "💡", keywords: ["callout", "info"] },
  { type: "code", label: "コード", desc: "コードブロック", icon: "</>", keywords: ["code", "コード"] },
  { type: "divider", label: "区切り線", desc: "水平線", icon: "—", keywords: ["divider", "hr", "区切り"] },
  { type: "database", label: "データベース", desc: "シンプルなテーブル", icon: "▦", keywords: ["database", "table", "テーブル", "db"] },
];

interface Props {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  top: number;
  left: number;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  filtered: SlashItem[];
}

export function SlashMenu({ onSelect, onClose, top, left, activeIndex, filtered }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div ref={ref} className="slash-menu" style={{ top, left }}>
      <div className="slash-menu-group-title">ブロック</div>
      {filtered.map((item, i) => (
        <div
          key={item.type}
          className={`slash-menu-item ${i === activeIndex ? "active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item.type);
          }}
        >
          <div className="slash-menu-icon">{item.icon}</div>
          <div>
            <div className="slash-menu-label">{item.label}</div>
            <div className="slash-menu-desc">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function filterItems(query: string): SlashItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (it) =>
      it.label.toLowerCase().includes(q) ||
      it.keywords.some((k) => k.toLowerCase().includes(q))
  );
}
