import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import type { Block, BlockType, Page } from "../types";
import { BlockEditor } from "./BlockEditor";
import { createDbData } from "../store";

interface Props {
  page: Page;
  onUpdatePage: (patch: Partial<Page>) => void;
  onUpdateBlocks: (blocks: Block[]) => void;
}

export function PageView({ page, onUpdatePage, onUpdateBlocks }: Props) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [caretTarget, setCaretTarget] = useState<"start" | "end">("end");
  const focusMap = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // IME-safe title buffer
  const [localTitle, setLocalTitle] = useState(page.title);
  const composingTitleRef = useRef(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!composingTitleRef.current) setLocalTitle(page.title);
  }, [page.title, page.id]);
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [localTitle]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (focusId) {
      const el = focusMap.current[focusId];
      if (el) {
        el.focus();
        const pos = caretTarget === "end" ? el.value.length : 0;
        el.setSelectionRange(pos, pos);
      }
      setFocusId(null);
    }
  }, [focusId, caretTarget]);

  const updateBlock = (id: string, patch: Partial<Block>) => {
    onUpdateBlocks(page.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const insertAfter = (id: string, newBlock: Block) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    const next = [...page.blocks];
    next.splice(idx + 1, 0, newBlock);
    onUpdateBlocks(next);
    setCaretTarget("start");
    setFocusId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = page.blocks.filter((b) => b.id !== id);
    if (next.length === 0) {
      next.push({ id: nanoid(8), type: "paragraph", text: "" });
    }
    onUpdateBlocks(next);
    const focusIdx = Math.max(0, idx - 1);
    setCaretTarget("end");
    setFocusId(next[focusIdx]?.id ?? null);
  };

  const handleEnter = (id: string, splitText: string = "") => {
    const current = page.blocks.find((b) => b.id === id);
    if (!current) return;
    // Carry list types forward; otherwise default to paragraph
    const carry: BlockType[] = ["bullet", "numbered", "todo"];
    const nextType: BlockType = carry.includes(current.type) ? current.type : "paragraph";
    const newBlock: Block = {
      id: nanoid(8),
      type: nextType,
      text: splitText,
      checked: nextType === "todo" ? false : undefined,
    };
    insertAfter(id, newBlock);
  };

  const handleBackspaceEmpty = (id: string) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    const prev = page.blocks[idx - 1];
    const next = page.blocks.filter((b) => b.id !== id);
    onUpdateBlocks(next);
    setCaretTarget("end");
    setFocusId(prev.id);
  };

  const handleTypeChange = (id: string, type: BlockType) => {
    onUpdateBlocks(
      page.blocks.map((b) => {
        if (b.id !== id) return b;
        const next: Block = { ...b, type };
        next.checked = type === "todo" ? b.checked ?? false : undefined;
        next.db = type === "database" ? b.db ?? createDbData() : undefined;
        return next;
      })
    );
    setFocusId(id);
  };

  const handleArrowUp = (id: string) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    if (idx > 0) {
      setCaretTarget("end");
      setFocusId(page.blocks[idx - 1].id);
    }
  };
  const handleArrowDown = (id: string) => {
    const idx = page.blocks.findIndex((b) => b.id === id);
    if (idx < page.blocks.length - 1) {
      setCaretTarget("start");
      setFocusId(page.blocks[idx + 1].id);
    }
  };

  const handleAddBelow = (id: string) => {
    insertAfter(id, { id: nanoid(8), type: "paragraph", text: "" });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = page.blocks.findIndex((b) => b.id === active.id);
    const newIdx = page.blocks.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onUpdateBlocks(arrayMove(page.blocks, oldIdx, newIdx));
  };

  return (
    <div className="page">
      <div className="page-head">
      <div
        className="page-icon"
        onClick={() => {
          const next = prompt("絵文字を入力", page.icon);
          if (next) onUpdatePage({ icon: next });
        }}
      >
        {page.icon}
      </div>
      <textarea
        ref={titleRef}
        className="page-title"
        value={localTitle}
        placeholder="無題"
        rows={1}
        onCompositionStart={() => {
          composingTitleRef.current = true;
        }}
        onCompositionEnd={(e) => {
          composingTitleRef.current = false;
          const v = (e.target as HTMLTextAreaElement).value.replace(/\n/g, "");
          setLocalTitle(v);
          onUpdatePage({ title: v });
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/\n/g, "");
          setLocalTitle(v);
          if (!composingTitleRef.current) onUpdatePage({ title: v });
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "Enter") {
            e.preventDefault();
            const first = page.blocks[0];
            if (first) {
              setCaretTarget("start");
              setFocusId(first.id);
            }
          }
        }}
      />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {page.blocks.map((block, i) => (
            <SortableBlock key={block.id} id={block.id}>
              {(handleProps) => (
                <BlockEditor
                  block={block}
                  index={i}
                  isLast={i === page.blocks.length - 1}
                  onChange={(patch) => updateBlock(block.id, patch)}
                  onEnter={(split) => handleEnter(block.id, split)}
                  onBackspaceEmpty={() => handleBackspaceEmpty(block.id)}
                  onDelete={() => deleteBlock(block.id)}
                  onTypeChange={(type) => handleTypeChange(block.id, type)}
                  onArrowUp={() => handleArrowUp(block.id)}
                  onArrowDown={() => handleArrowDown(block.id)}
                  onAddBelow={() => handleAddBelow(block.id)}
                  focusRef={(el) => (focusMap.current[block.id] = el)}
                  dragHandleProps={handleProps}
                />
              )}
            </SortableBlock>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableBlock({
  id,
  children,
}: {
  id: string;
  children: (handleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>)}
    </div>
  );
}
