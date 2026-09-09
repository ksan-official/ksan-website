import type { GuideBlock } from "@/lib/types";

export type GuideTocHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

function flattenGuideBlocks(blocks: GuideBlock[]): GuideBlock[] {
  return blocks.flatMap((block) => [block, ...(block.children ? flattenGuideBlocks(block.children) : [])]);
}

export function buildGuideTocHeadings(
  blocks: GuideBlock[],
  resolveId: (block: GuideBlock) => string = (block) => block.id
): GuideTocHeading[] {
  const headings: GuideTocHeading[] = [];
  let hasParentHeading = false;

  for (const block of flattenGuideBlocks(blocks)) {
    if (block.type === "heading_1") {
      hasParentHeading = false;
      continue;
    }

    if (block.type === "heading_2") {
      headings.push({ id: resolveId(block), level: 2, text: block.text });
      hasParentHeading = true;
      continue;
    }

    if (block.type === "heading_3" && hasParentHeading) {
      headings.push({ id: resolveId(block), level: 3, text: block.text });
    }
  }

  return headings;
}
