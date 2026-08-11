import type { GuideBlock } from "@/lib/types";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function slugFromTitle(title: string) {
  return normalizeSlug(title) || `guide-${Date.now()}`;
}

export function parseGuideText(rawText: string): GuideBlock[] {
  const lines = rawText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const id = `block-${index + 1}`;
    if (line.startsWith("### ")) {
      return { id, type: "heading_3", text: line.replace(/^###\s+/, "") };
    }
    if (line.startsWith("## ")) {
      return { id, type: "heading_2", text: line.replace(/^##\s+/, "") };
    }
    if (line.startsWith("# ")) {
      return { id, type: "heading_1", text: line.replace(/^#\s+/, "") };
    }
    if (/^[-*]\s+/.test(line)) {
      return { id, type: "bulleted_list_item", text: line.replace(/^[-*]\s+/, "") };
    }
    if (/^\d+[.)]\s+/.test(line)) {
      return { id, type: "numbered_list_item", text: line.replace(/^\d+[.)]\s+/, "") };
    }
    if (line.startsWith("> ")) {
      return { id, type: "quote", text: line.replace(/^>\s+/, "") };
    }
    return { id, type: "paragraph", text: line };
  });
}

export function deriveSummary(rawText: string) {
  const firstParagraph = parseGuideText(rawText).find((block) => block.type === "paragraph");
  return firstParagraph?.text.slice(0, 160) ?? "";
}
