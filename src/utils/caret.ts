/**
 * Compute the viewport position of the caret inside a textarea or input
 * by rendering an offscreen clone with matching styles and measuring where
 * a span sits at the caret offset. Works for wrapped textareas too.
 */
export function caretViewportPosition(el: HTMLTextAreaElement | HTMLInputElement): {
  top: number;
  left: number;
  lineHeight: number;
} {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  const isInput = el.tagName === "INPUT";

  const mirror = document.createElement("div");
  const s = mirror.style;
  const props = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "MozTabSize" as any,
  ] as const;
  props.forEach((p) => ((s as any)[p] = (style as any)[p]));
  s.position = "absolute";
  s.visibility = "hidden";
  s.whiteSpace = isInput ? "pre" : "pre-wrap";
  s.wordWrap = "break-word";
  s.top = "0";
  s.left = "-9999px";

  const caret = el.selectionStart ?? 0;
  mirror.textContent = el.value.substring(0, caret) || "";
  const span = document.createElement("span");
  span.textContent = el.value.substring(caret) || ".";
  mirror.appendChild(span);
  document.body.appendChild(mirror);

  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
  const top = rect.top + span.offsetTop - el.scrollTop + lineHeight;
  const left = rect.left + span.offsetLeft - el.scrollLeft;

  document.body.removeChild(mirror);
  return { top, left, lineHeight };
}
