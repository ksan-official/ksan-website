"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bold, Eraser, Italic, Link, List, ListOrdered, Minus, Quote, Strikethrough, Underline } from "lucide-react";

type AdminFormattedTextareaProps = {
  defaultValue?: string;
  name: string;
  required?: boolean;
  rows?: number;
};

type BlockStyle = "body" | "h2" | "h3";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/~~(.*?)~~/g, "<s>$1</s>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(value: string) {
  return value
    .split(/\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed === "---") return "<hr>";
      if (trimmed.startsWith("### ")) return `<h3>${applyInlineMarkdown(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${applyInlineMarkdown(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("> ")) return `<blockquote>${applyInlineMarkdown(trimmed.slice(2))}</blockquote>`;
      if (/^[-*]\s+/.test(trimmed)) return `<p>${applyInlineMarkdown(trimmed.replace(/^[-*]\s+/, "• "))}</p>`;
      if (/^\d+\.\s+/.test(trimmed)) return `<p>${applyInlineMarkdown(trimmed)}</p>`;
      return `<p>${applyInlineMarkdown(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function normalizeInitialHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "<p><br></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return markdownToHtml(trimmed) || "<p><br></p>";
}

function plainTextToHtml(value: string) {
  return value
    .split(/\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function rangeElement(range: Range) {
  const node = range.startContainer;
  return node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
}

function blockFromRange(editor: HTMLElement, range: Range) {
  const element = rangeElement(range);
  const block = element?.closest("p, h2, h3, blockquote, li");
  return block && editor.contains(block) ? block : null;
}

function fallbackRange(editor: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(editor.lastElementChild ?? editor);
  range.collapse(false);
  return range;
}

function normalizeEditorContent(editor: HTMLElement) {
  const hasText = Boolean(editor.textContent?.trim()) || Boolean(editor.querySelector("img, hr"));
  if (!hasText) return "";
  return editor.innerHTML
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .trim();
}

export function AdminFormattedTextarea({ defaultValue, name, required }: AdminFormattedTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const styleSelectRef = useRef<HTMLSelectElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const initialHtml = useMemo(() => normalizeInitialHtml(defaultValue ?? ""), [defaultValue]);
  const [hasContent, setHasContent] = useState(Boolean(defaultValue?.trim()));

  const resetStyleSelect = useCallback(() => {
    const select = styleSelectRef.current;
    if (!select) return;

    select.value = "";
    select.blur();
  }, []);

  const syncHtml = useCallback(() => {
    const editor = editorRef.current;
    const input = inputRef.current;
    if (!editor || !input) return;

    const value = normalizeEditorContent(editor);
    input.value = value;
    editor.classList.toggle("is-empty", !value);
    setHasContent(Boolean(value));
  }, []);

  const currentRange = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const element = rangeElement(range);
    return element && editor.contains(element) ? range : null;
  }, []);

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    const range = currentRange();
    if (!editor || !range) return;

    savedRangeRef.current = range.cloneRange();
  }, [currentRange]);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;

    editor.focus();
    const range = savedRangeRef.current ?? fallbackRange(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const runCommand = useCallback((command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    syncHtml();
  }, [restoreSelection, saveSelection, syncHtml]);

  const setSelectionAfter = useCallback((node: Node) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  }, []);

  const setSelectionInside = useCallback((node: Node) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  }, []);

  const applyBlockStyle = useCallback((style: BlockStyle) => {
    const editor = editorRef.current;
    if (!editor) return;

    restoreSelection();
    const range = currentRange() ?? fallbackRange(editor);
    const selectedBlock = blockFromRange(editor, range);
    const target = selectedBlock?.tagName === "LI" ? selectedBlock.parentElement : selectedBlock;
    if (!target || !editor.contains(target)) return;

    const nextTag = style === "body" ? "p" : style;
    const nextBlock = document.createElement(nextTag);
    nextBlock.innerHTML = target.innerHTML || "<br>";
    target.replaceWith(nextBlock);
    setSelectionInside(nextBlock);
    resetStyleSelect();
    syncHtml();
  }, [currentRange, resetStyleSelect, restoreSelection, setSelectionInside, syncHtml]);

  const insertPlainTextParagraphs = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    restoreSelection();
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : fallbackRange(editor);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = plainTextToHtml(text) || "<p><br></p>";
    range.deleteContents();

    const fragment = document.createDocumentFragment();
    let lastNode: ChildNode | null = null;
    Array.from(wrapper.childNodes).forEach((node) => {
      lastNode = fragment.appendChild(node);
    });

    range.insertNode(fragment);
    if (lastNode) setSelectionAfter(lastNode);
    syncHtml();
  }, [restoreSelection, setSelectionAfter, syncHtml]);

  const toggleQuote = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    restoreSelection();
    const range = currentRange() ?? fallbackRange(editor);
    const selectedBlock = blockFromRange(editor, range);
    const quote = selectedBlock?.closest("blockquote");

    if (quote && editor.contains(quote)) {
      const paragraph = document.createElement("p");
      paragraph.innerHTML = quote.innerHTML || "<br>";
      quote.replaceWith(paragraph);
      setSelectionAfter(paragraph);
    } else {
      const target = selectedBlock ?? editor.lastElementChild ?? editor;
      const blockquote = document.createElement("blockquote");
      blockquote.innerHTML = target.innerHTML || "<br>";
      target.replaceWith(blockquote);
      setSelectionAfter(blockquote);
    }

    saveSelection();
    syncHtml();
  }, [currentRange, restoreSelection, saveSelection, setSelectionAfter, syncHtml]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    form.addEventListener("submit", syncHtml, { capture: true });
    document.addEventListener("ksan:sync-rich-text", syncHtml);
    document.addEventListener("selectionchange", saveSelection);
    return () => {
      form.removeEventListener("submit", syncHtml, { capture: true });
      document.removeEventListener("ksan:sync-rich-text", syncHtml);
      document.removeEventListener("selectionchange", saveSelection);
    };
  }, [saveSelection, syncHtml]);

  function handleToolbarMouseDown(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    restoreSelection();
  }

  function handleEditorInput() {
    resetStyleSelect();
    saveSelection();
    syncHtml();
  }

  function handleEditorSelection() {
    resetStyleSelect();
    saveSelection();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    insertPlainTextParagraphs(event.clipboardData.getData("text/plain"));
  }

  function handleCommand(event: MouseEvent<HTMLButtonElement>, command: string, value?: string) {
    handleToolbarMouseDown(event);
    runCommand(command, value);
  }

  function handleStyleChange(value: string) {
    applyBlockStyle(value as BlockStyle);
    resetStyleSelect();
  }

  function handleLink(event: MouseEvent<HTMLButtonElement>) {
    handleToolbarMouseDown(event);
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      document.execCommand("insertText", false, "링크 텍스트");
      saveSelection();
    }

    const url = window.prompt("연결할 링크를 입력해주세요.", "https://");
    if (!url) return;
    runCommand("createLink", url);
  }

  function handleQuote(event: MouseEvent<HTMLButtonElement>) {
    handleToolbarMouseDown(event);
    toggleQuote();
  }

  return (
    <div className="admin-rich-text">
      <div className="admin-rich-text-toolbar" aria-label="본문 서식 도구">
        <select
          aria-label="문단 스타일"
          defaultValue=""
          onChange={(event) => handleStyleChange(event.currentTarget.value)}
          onMouseDown={saveSelection}
          ref={styleSelectRef}
        >
          <option disabled value="">서식</option>
          <option value="body">본문</option>
          <option value="h2">제목</option>
          <option value="h3">소제목</option>
        </select>
        <button aria-label="굵게" onMouseDown={(event) => handleCommand(event, "bold")} type="button"><Bold aria-hidden size={18} /></button>
        <button aria-label="기울임" onMouseDown={(event) => handleCommand(event, "italic")} type="button"><Italic aria-hidden size={18} /></button>
        <button aria-label="밑줄" onMouseDown={(event) => handleCommand(event, "underline")} type="button"><Underline aria-hidden size={18} /></button>
        <button aria-label="취소선" onMouseDown={(event) => handleCommand(event, "strikeThrough")} type="button"><Strikethrough aria-hidden size={18} /></button>
        <span aria-hidden className="admin-rich-text-divider" />
        <button aria-label="목록" onMouseDown={(event) => handleCommand(event, "insertUnorderedList")} type="button"><List aria-hidden size={18} /></button>
        <button aria-label="번호 목록" onMouseDown={(event) => handleCommand(event, "insertOrderedList")} type="button"><ListOrdered aria-hidden size={18} /></button>
        <button aria-label="인용" onMouseDown={handleQuote} type="button"><Quote aria-hidden size={18} /></button>
        <button aria-label="링크" onMouseDown={handleLink} type="button"><Link aria-hidden size={18} /></button>
        <button aria-label="구분선" onMouseDown={(event) => handleCommand(event, "insertHorizontalRule")} type="button"><Minus aria-hidden size={18} /></button>
        <span aria-hidden className="admin-rich-text-divider" />
        <button aria-label="서식 지우기" onMouseDown={(event) => handleCommand(event, "removeFormat")} type="button"><Eraser aria-hidden size={18} /></button>
      </div>
      <div className="admin-rich-text-frame-wrap">
        <div
          aria-label="공고 본문"
          className={`admin-rich-text-editor${hasContent ? "" : " is-empty"}`}
          contentEditable
          dangerouslySetInnerHTML={{ __html: initialHtml }}
          onBlur={saveSelection}
          onClick={handleEditorSelection}
          onFocus={handleEditorSelection}
          onInput={handleEditorInput}
          onKeyUp={handleEditorSelection}
          onMouseDown={resetStyleSelect}
          onMouseUp={handleEditorSelection}
          onPaste={handlePaste}
          ref={editorRef}
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
        />
      </div>
      <input defaultValue={initialHtml === "<p><br></p>" ? "" : initialHtml} name={name} ref={inputRef} required={required} type="hidden" />
    </div>
  );
}
