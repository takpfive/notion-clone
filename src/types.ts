export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bullet"
  | "numbered"
  | "quote"
  | "code"
  | "divider"
  | "callout"
  | "database";

export type DbColumnType = "text" | "number" | "select" | "checkbox" | "date";

export interface DbColumn {
  id: string;
  name: string;
  type: DbColumnType;
  options?: string[];
}

export interface DbRow {
  id: string;
  cells: Record<string, string | boolean>;
}

export interface DbData {
  columns: DbColumn[];
  rows: DbRow[];
  title: string;
}

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  db?: DbData;
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  pages: Record<string, Page>;
  rootOrder: string[];
  activePageId: string | null;
  expandedIds: string[];
}
