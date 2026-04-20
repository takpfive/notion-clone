import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { PageView } from "./components/PageView";
import { createPage, getDescendantIds, loadState, saveState } from "./store";
import type { AppState, Block, Page } from "./types";

function App() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activePage: Page | null = state.activePageId ? state.pages[state.activePageId] ?? null : null;

  const selectPage = (id: string) =>
    setState((s) => ({ ...s, activePageId: id }));

  const addRootPage = () => {
    const p = createPage(null, "");
    setState((s) => ({
      ...s,
      pages: { ...s.pages, [p.id]: p },
      rootOrder: [...s.rootOrder, p.id],
      activePageId: p.id,
    }));
  };

  const addChildPage = (parentId: string) => {
    const p = createPage(parentId, "");
    setState((s) => ({
      ...s,
      pages: { ...s.pages, [p.id]: p },
      activePageId: p.id,
      expandedIds: s.expandedIds.includes(parentId) ? s.expandedIds : [...s.expandedIds, parentId],
    }));
  };

  const deletePage = (id: string) => {
    setState((s) => {
      const descendants = getDescendantIds(s, id);
      const toRemove = new Set([id, ...descendants]);
      const nextPages: Record<string, Page> = {};
      for (const [k, v] of Object.entries(s.pages)) {
        if (!toRemove.has(k)) nextPages[k] = v;
      }
      const nextRoot = s.rootOrder.filter((pid) => !toRemove.has(pid));
      const nextActive = toRemove.has(s.activePageId ?? "")
        ? nextRoot[0] ?? Object.keys(nextPages)[0] ?? null
        : s.activePageId;
      return {
        ...s,
        pages: nextPages,
        rootOrder: nextRoot,
        activePageId: nextActive,
        expandedIds: s.expandedIds.filter((eid) => !toRemove.has(eid)),
      };
    });
  };

  const toggleExpand = (id: string) => {
    setState((s) => ({
      ...s,
      expandedIds: s.expandedIds.includes(id)
        ? s.expandedIds.filter((e) => e !== id)
        : [...s.expandedIds, id],
    }));
  };

  const updatePage = (patch: Partial<Page>) => {
    if (!activePage) return;
    setState((s) => ({
      ...s,
      pages: {
        ...s.pages,
        [activePage.id]: { ...activePage, ...patch, updatedAt: Date.now() },
      },
    }));
  };

  const updateBlocks = (blocks: Block[]) => {
    if (!activePage) return;
    setState((s) => ({
      ...s,
      pages: {
        ...s.pages,
        [activePage.id]: { ...activePage, blocks, updatedAt: Date.now() },
      },
    }));
  };

  const breadcrumbs = activePage ? buildBreadcrumbs(state, activePage.id) : [];

  return (
    <div className="app">
      <Sidebar
        state={state}
        onSelect={selectPage}
        onAddRoot={addRootPage}
        onAddChild={addChildPage}
        onDelete={deletePage}
        onToggleExpand={toggleExpand}
      />
      <main className="main">
        <div className="topbar">
          {breadcrumbs.map((p, i) => (
            <span key={p.id}>
              <span className={`topbar-crumb ${i === breadcrumbs.length - 1 ? "current" : ""}`}>
                {p.icon} {p.title || "無題"}
              </span>
              {i < breadcrumbs.length - 1 && <span className="topbar-sep"> / </span>}
            </span>
          ))}
        </div>
        {activePage ? (
          <PageView page={activePage} onUpdatePage={updatePage} onUpdateBlocks={updateBlocks} />
        ) : (
          <div className="empty-state">左のサイドバーからページを作成してください</div>
        )}
      </main>
    </div>
  );
}

function buildBreadcrumbs(state: AppState, id: string): Page[] {
  const chain: Page[] = [];
  let cur: Page | undefined = state.pages[id];
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? state.pages[cur.parentId] : undefined;
  }
  return chain;
}

export default App;
