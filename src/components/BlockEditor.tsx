import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Block, BlockType, DbData } from "../types";
import { filterItems, SlashMenu, type SlashItem } from "./SlashMenu";
import { DatabaseBlock } from "./DatabaseBlock";
import { caretViewportPosition } from "../utils/caret";

interface Props {
  block: Block;
  index: number;
  isLast: boolean;
  onChange: (patch: Partial<Block>) => void;
  onEnter: (splitText?: string) => void;
  onBackspaceEmpty: () => void;
  onDelete: () => void;
  onTypeChange: (type: BlockType) => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onAddBelow: () => void;
  focusRef?: (el: HTMLTextAreaElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function BlockEditor({
  block,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onDelete,
  onTypeChange,
  onArrowUp,
  onArrowDown,
  onAddBelow,
  focusRef,
  dragHandleProps,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const [localText, setLocalText] = useState(block.text);
  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;
    top: number;
    left: number;
    activeIndex: number;
  }>({ open: false, query: "", top: 0, left: 0, activeIndex: 0 });

  // Sync external changes to local buffer when not composing.
  useEffect(() => {
    if (!composingRef.current) setLocalText(block.text);
  }, [block.text]);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && block.type !== "divider" && block.type !== "database") {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [localText, block.type]);

  useEffect(() => {
    if (focusRef) focusRef(inputRef.current);
  });

  const filtered: SlashItem[] = slashState.open ? filterItems(slashState.query) : [];

  const placeholderFor = (t: BlockType) => {
    switch (t) {
      case "h1": return "見出し 1";
      case "h2": return "見出し 2";
      case "h3": return "見出し 3";
      case "todo": return "To-Do";
      case "bullet": return "リスト";
      case "numbered": return "リスト";
      case "quote": return "引用";
      case "code": return "コード";
      case "callout": return "コールアウト";
      default: return "「/」でコマンド、テキストを入力...";
    }
  };

  const closeSlash = () => setSlashState((s) => ({ ...s, open: false }));

  const openSlash = () => {
    const el = inputRef.current;
    if (!el) return;
    const pos = caretViewportPosition(el);
    setSlashState({
      open: true,
      query: "",
      top: pos.top,
      left: pos.left,
      activeIndex: 0,
    });
  };

  const updateSlashPosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const pos = caretViewportPosition(el);
    setSlashState((s) => ({ ...s, top: pos.top, left: pos.left }));
  };

  const commitText = (text: string) => {
    setLocalText(text);
    onChange({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Never intercept keys while composing (Japanese/Chinese IME)
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;

    // Cmd/Ctrl + Shift + N — convert block type
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey) {
      const map: Record<string, BlockType> = {
        "1": "h1",
        "2": "h2",
        "3": "h3",
        "4": "todo",
        "5": "bullet",
        "6": "quote",
        "7": "numbered",
        "8": "callout",
        "9": "code",
        "0": "paragraph",
      };
      const target = map[e.key];
      if (target) {
        e.preventDefault();
        onTypeChange(target);
        return;
      }
    }

    if (slashState.open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashState((s) => ({ ...s, activeIndex: Math.min(s.activeIndex + 1, filtered.length - 1) }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashState((s) => ({ ...s, activeIndex: Math.max(s.activeIndex - 1, 0) }));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const pick = filtered[slashState.activeIndex];
        if (pick) selectSlashItem(pick.type);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeSlash();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !slashState.open) {
      e.preventDefault();
      const el = inputRef.current!;
      const caret = el.selectionStart;
      const before = localText.slice(0, caret);
      const after = localText.slice(caret);
      commitText(before);
      onEnter(after);
      return;
    }

    if (e.key === "Backspace" && localText === "" && !slashState.open) {
      e.preventDefault();
      if (block.type !== "paragraph") {
        onTypeChange("paragraph");
      } else {
        onBackspaceEmpty();
      }
      return;
    }

    if (e.key === "ArrowUp") {
      const el = inputRef.current!;
      if (el.selectionStart === 0) {
        e.preventDefault();
        onArrowUp();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      const el = inputRef.current!;
      if (el.selectionStart === el.value.length) {
        e.preventDefault();
        onArrowDown();
      }
      return;
    }

    if (e.key === " " && !slashState.open) {
      const el = inputRef.current!;
      const beforeCaret = localText.slice(0, el.selectionStart);
      const map: Record<string, BlockType> = {
        "#": "h1",
        "##": "h2",
        "###": "h3",
        "-": "bullet",
        "*": "bullet",
        "1.": "numbered",
        ">": "quote",
        "[]": "todo",
        "```": "code",
      };
      if (map[beforeCaret]) {
        e.preventDefault();
        commitText("");
        onTypeChange(map[beforeCaret]);
        return;
      }
    }
  };

  const selectSlashItem = (type: BlockType) => {
    const el = inputRef.current;
    if (el) {
      const caret = el.selectionStart;
      const before = localText.slice(0, caret);
      const slashIdx = before.lastIndexOf("/");
      const newText = slashIdx >= 0 ? localText.slice(0, slashIdx) + localText.slice(caret) : localText;
      commitText(newText);
    }
    onTypeChange(type);
    closeSlash();
  };

  const detectSlash = (val: string, caret: number) => {
    const before = val.slice(0, caret);
    const slashIdx = before.lastIndexOf("/");
    if (slashIdx >= 0) {
      const afterSlash = before.slice(slashIdx + 1);
      if (/^[^\s]*$/.test(afterSlash)) {
        const charBeforeSlash = slashIdx === 0 ? " " : before[slashIdx - 1];
        if (/\s/.test(charBeforeSlash) || slashIdx === 0) {
          if (!slashState.open) {
            openSlash();
          } else {
            updateSlashPosition();
          }
          setSlashState((s) => ({ ...s, query: afterSlash, activeIndex: 0 }));
          return;
        }
      }
    }
    if (slashState.open) closeSlash();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalText(val);
    if (composingRef.current) return; // wait for compositionend
    onChange({ text: val });
    detectSlash(val, e.target.selectionStart);
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    const val = (e.target as HTMLTextAreaElement).value;
    setLocalText(val);
    onChange({ text: val });
    const caret = (e.target as HTMLTextAreaElement).selectionStart;
    detectSlash(val, caret);
  };

  const renderInput = () => (
    <textarea
      ref={inputRef}
      className="block-input"
      value={localText}
      placeholder={placeholderFor(block.type)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      rows={1}
    />
  );

  if (block.type === "divider") {
    return (
      <div className="block-row">
        <div className="block-handle-area">
          <button className="block-handle-btn plus" title="下に追加" onClick={onAddBelow}>＋</button>
          <button className="block-handle-btn" title="ドラッグで移動" {...dragHandleProps}>⋮⋮</button>
        </div>
        <div className="block-content block-divider" onClick={onDelete}>
          <hr />
        </div>
      </div>
    );
  }

  if (block.type === "database") {
    return (
      <div className="block-row">
        <div className="block-handle-area">
          <button className="block-handle-btn plus" title="下に追加" onClick={onAddBelow}>＋</button>
          <button className="block-handle-btn" title="ドラッグで移動" {...dragHandleProps}>⋮⋮</button>
        </div>
        <div className="block-content">
          <DatabaseBlock
            data={block.db!}
            onChange={(next: DbData) => onChange({ db: next })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="block-row">
      <div className="block-handle-area">
        <button className="block-handle-btn plus" title="下に追加" onClick={onAddBelow}>＋</button>
        <button className="block-handle-btn" title="ドラッグで移動" {...dragHandleProps}>⋮⋮</button>
      </div>
      <div className={`block-content block-${block.type} ${block.checked ? "checked" : ""}`}>
        {block.type === "todo" && (
          <>
            <input
              type="checkbox"
              className="block-todo-check"
              checked={!!block.checked}
              onChange={(e) => onChange({ checked: e.target.checked })}
            />
            {renderInput()}
          </>
        )}
        {block.type === "bullet" && (
          <>
            <span className="block-marker">•</span>
            {renderInput()}
          </>
        )}
        {block.type === "numbered" && (
          <>
            <span className="block-marker">1.</span>
            {renderInput()}
          </>
        )}
        {!["todo", "bullet", "numbered"].includes(block.type) && renderInput()}
      </div>
      {slashState.open && (
        <SlashMenu
          query={slashState.query}
          onSelect={selectSlashItem}
          onClose={closeSlash}
          top={slashState.top}
          left={slashState.left}
          activeIndex={slashState.activeIndex}
          setActiveIndex={(i) => setSlashState((s) => ({ ...s, activeIndex: i }))}
          filtered={filtered}
        />
      )}
    </div>
  );
}
