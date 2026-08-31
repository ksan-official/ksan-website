import type { GuideBlock } from "@/lib/types";

function plainRichText(text: string) {
  return text ? [{ text }] : undefined;
}

export function normalizeSlug(value: string) {
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

  const blocks: GuideBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const id = `block-${index + 1}`;
    const image = line.match(/^!\[(.*?)]\((.*?)\)$/);
    const file = line.match(/^\[파일:\s*(.*?)]\((.*?)\)$/);

    if (image) {
      blocks.push({ id, type: "image", caption: plainRichText(image[1]), text: image[1], url: image[2] });
      continue;
    }

    if (file) {
      blocks.push({
        id,
        type: "file",
        caption: plainRichText(file[1]),
        name: file[1] || "첨부 파일",
        text: file[1] || "첨부 파일",
        url: file[2]
      });
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (lines[index]?.startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      const rows = tableLines
        .filter((item) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(item))
        .map((item) =>
          item
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((cell) => cell.trim())
        );
      if (rows.length) {
        blocks.push({ id, type: "table", hasColumnHeader: tableLines.length > rows.length, rows, text: "" });
      }
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ id, type: "heading_3", text: line.replace(/^###\s+/, "") });
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ id, type: "heading_2", text: line.replace(/^##\s+/, "") });
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ id, type: "heading_1", text: line.replace(/^#\s+/, "") });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      blocks.push({ id, type: "bulleted_list_item", text: line.replace(/^[-*]\s+/, "") });
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      blocks.push({ id, type: "numbered_list_item", text: line.replace(/^\d+[.)]\s+/, "") });
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push({ id, type: "quote", text: line.replace(/^>\s+/, "") });
      continue;
    }
    blocks.push({ id, type: "paragraph", text: line });
  }

  return blocks;
}

export function deriveSummary(rawText: string) {
  const firstParagraph = parseGuideText(rawText).find((block) => block.type === "paragraph");
  return firstParagraph?.text.slice(0, 160) ?? "";
}
