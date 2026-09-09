import type { GuideBlock } from "@/lib/types";

const HASH_TAG_PATTERN = /(?:^|[\s([{])#([^\s#.,!?;:()[\]{}<>"'`]+)/g;

function normalizeGuideTag(tag: string) {
  return tag
    .trim()
    .replace(/^#+/, "")
    .replace(/[.,!?;:()[\]{}<>"'`]+$/g, "");
}

export function parseGuideTags(value: string) {
  const tags = value
    .split(/[,\s]+/)
    .map(normalizeGuideTag)
    .filter(Boolean);

  return Array.from(new Set(tags));
}

export function extractHashTagsFromText(value: string) {
  const tags: string[] = [];

  for (const match of value.matchAll(HASH_TAG_PATTERN)) {
    const tag = normalizeGuideTag(match[1] ?? "");
    if (tag) tags.push(tag);
  }

  return Array.from(new Set(tags));
}

export function extractHashTagsFromBlocks(blocks: GuideBlock[]): string[] {
  return Array.from(new Set(blocks.flatMap((block) => [
    ...extractHashTagsFromText(block.text),
    ...(block.rows?.flatMap((row) => row.flatMap(extractHashTagsFromText)) ?? []),
    ...(block.tableRows?.flatMap((row) => row.flatMap((cell) => cell.flatMap((segment) => extractHashTagsFromText(segment.text)))) ?? []),
    ...(block.children ? extractHashTagsFromBlocks(block.children) : [])
  ])));
}

export function mergeGuideTags(...tagGroups: string[][]) {
  return Array.from(new Set(tagGroups.flatMap((tags) => tags.map(normalizeGuideTag).filter(Boolean))));
}

export function formatGuideTagsInput(tags: string[]) {
  return tags.map((tag) => `#${normalizeGuideTag(tag)}`).filter((tag) => tag.length > 1).join(" ");
}
