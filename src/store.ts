import { nanoid } from "nanoid";
import type { AppState, Block, BlockType, DbData, Page } from "./types";

const STORAGE_KEY = "notion-clone-state-v1";

export function createDbData(): DbData {
  const colA = { id: nanoid(6), name: "名前", type: "text" as const };
  const colB = { id: nanoid(6), name: "ステータス", type: "select" as const, options: ["未着手", "進行中", "完了"] };
  const colC = { id: nanoid(6), name: "完了", type: "checkbox" as const };
  const colD = { id: nanoid(6), name: "期日", type: "date" as const };
  return {
    title: "データベース",
    columns: [colA, colB, colC, colD],
    rows: [
      { id: nanoid(6), cells: { [colA.id]: "タスク1", [colB.id]: "進行中", [colC.id]: false, [colD.id]: "" } },
      { id: nanoid(6), cells: { [colA.id]: "タスク2", [colB.id]: "未着手", [colC.id]: false, [colD.id]: "" } },
    ],
  };
}

export function createBlock(type: BlockType = "paragraph", text = ""): Block {
  const block: Block = { id: nanoid(8), type, text };
  if (type === "todo") block.checked = false;
  if (type === "database") block.db = createDbData();
  return block;
}

export function createPage(parentId: string | null = null, title = ""): Page {
  const now = Date.now();
  return {
    id: nanoid(10),
    title,
    icon: randomIcon(),
    parentId,
    blocks: [createBlock("paragraph", "")],
    createdAt: now,
    updatedAt: now,
  };
}

const ICONS = ["📄", "📝", "📚", "💡", "🚀", "🎯", "✨", "🌱", "🔥", "🍀", "🧠", "🗂️", "📌", "🎨", "🧩"];
export function randomIcon() {
  return ICONS[Math.floor(Math.random() * ICONS.length)];
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.pages) return parsed;
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return seed();
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function seed(): AppState {
  const welcome = createPage(null, "はじめに");
  welcome.icon = "👋";
  welcome.blocks = [
    { id: nanoid(8), type: "h1", text: "ようこそ Notion クローンへ" },
    { id: nanoid(8), type: "paragraph", text: "これはローカルで動作するノートアプリです。データはブラウザに保存されます。" },
    { id: nanoid(8), type: "h2", text: "基本操作" },
    { id: nanoid(8), type: "bullet", text: "Enter で新しいブロック" },
    { id: nanoid(8), type: "bullet", text: "Backspace（空のとき）で前のブロックに戻る" },
    { id: nanoid(8), type: "bullet", text: "「/」でスラッシュコマンド" },
    { id: nanoid(8), type: "bullet", text: "ブロックの左の ⋮⋮ をドラッグで並べ替え" },
    { id: nanoid(8), type: "h2", text: "ブロックタイプ" },
    { id: nanoid(8), type: "todo", text: "To-Do リスト", checked: false },
    { id: nanoid(8), type: "todo", text: "チェック済み", checked: true },
    { id: nanoid(8), type: "quote", text: "引用はこんな感じ。" },
    { id: nanoid(8), type: "callout", text: "💡 コールアウトでポイントを強調" },
    { id: nanoid(8), type: "code", text: "console.log('hello notion');" },
    { id: nanoid(8), type: "divider", text: "" },
    { id: nanoid(8), type: "paragraph", text: "左サイドバーから新しいページを追加できます。" },
  ];

  const sub = createPage(welcome.id, "サブページの例");
  sub.icon = "🌱";

  return {
    pages: {
      [welcome.id]: { ...welcome, blocks: [...welcome.blocks] },
      [sub.id]: sub,
    },
    rootOrder: [welcome.id],
    activePageId: welcome.id,
    expandedIds: [welcome.id],
  };
}

export function getChildren(state: AppState, parentId: string | null): Page[] {
  if (parentId === null) {
    return state.rootOrder.map((id) => state.pages[id]).filter(Boolean);
  }
  return Object.values(state.pages).filter((p) => p.parentId === parentId);
}

export function getDescendantIds(state: AppState, pageId: string): string[] {
  const out: string[] = [];
  const stack = [pageId];
  while (stack.length) {
    const id = stack.pop()!;
    const children = Object.values(state.pages).filter((p) => p.parentId === id);
    for (const c of children) {
      out.push(c.id);
      stack.push(c.id);
    }
  }
  return out;
}
