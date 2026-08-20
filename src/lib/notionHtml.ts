type NotionRichText = {
  annotations?: {
    bold?: boolean;
    code?: boolean;
    color?: string;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
  };
  href?: string | null;
  plain_text?: string;
};

type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
} & Record<string, unknown>;

type NotionFileValue = {
  caption?: NotionRichText[];
  external?: { url?: string };
  file?: { url?: string };
  name?: string;
  type?: "external" | "file" | "file_upload";
};

const LIST_TYPES = new Set(["bulleted_list_item", "numbered_list_item"]);

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function richTextToPlain(richText: NotionRichText[] = []) {
  return richText.map((item) => decodeHtmlEntities(item.plain_text || "")).join("").trim();
}

export function blockAnchorId(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w가-힣-]/g, "") || "section"
  );
}

export function richTextToHtml(richText: NotionRichText[] = []) {
  return richText
    .map((item) => {
      let content = escapeHtml(decodeHtmlEntities(item.plain_text || "")).replaceAll("\n", "<br />");
      const annotations = item.annotations || {};

      if (annotations.code) content = `<code>${content}</code>`;
      if (annotations.bold) content = `<strong>${content}</strong>`;
      if (annotations.italic) content = `<em>${content}</em>`;
      if (annotations.underline) content = `<u>${content}</u>`;
      if (annotations.strikethrough) content = `<s>${content}</s>`;

      const color = annotations.color && annotations.color !== "default" ? notionColorToStyle(annotations.color) : "";
      if (color) content = `<span style="${color}">${content}</span>`;
      if (item.href) content = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noreferrer">${content}</a>`;

      return content;
    })
    .join("");
}

function decodeHtmlEntities(value = "") {
  return String(value)
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export async function blocksToHtml(blocks: NotionBlock[], loadChildren: (blockId: string) => Promise<NotionBlock[]>) {
  const html: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (LIST_TYPES.has(block.type)) {
      const { markup, nextIndex } = await renderList(blocks, index, loadChildren);
      html.push(markup);
      index = nextIndex - 1;
      continue;
    }

    const markup = await renderBlock(block, loadChildren);
    if (markup) html.push(markup);
  }

  return html.join("\n");
}

async function renderBlock(block: NotionBlock, loadChildren: (blockId: string) => Promise<NotionBlock[]>) {
  const value = (block[block.type] || {}) as Record<string, unknown>;
  const richText = (value.rich_text || []) as NotionRichText[];
  const text = richTextToHtml(richText);
  const plainText = richTextToPlain(richText);
  const children = block.has_children ? await blocksToHtml(await loadChildren(block.id), loadChildren) : "";

  switch (block.type) {
    case "paragraph":
      return text || children ? `<p>${text}${children}</p>` : "";
    case "heading_1":
      return `<h2 id="${escapeHtml(blockAnchorId(plainText))}">${text}</h2>`;
    case "heading_2":
      return `<h2 id="${escapeHtml(blockAnchorId(plainText))}">${text}</h2>`;
    case "heading_3":
      return `<h3 id="${escapeHtml(blockAnchorId(plainText))}">${text}</h3>`;
    case "quote":
      return `<blockquote>${text}${children}</blockquote>`;
    case "callout":
      return `<blockquote>${iconMarkup(value.icon)}${text}${children}</blockquote>`;
    case "divider":
      return "<hr />";
    case "to_do":
      return `<p>${Boolean(value.checked) ? "✓" : "□"} ${text}${children}</p>`;
    case "toggle":
      return `<details><summary>${text}</summary>${children}</details>`;
    case "image":
      return renderMediaFigure(value as NotionFileValue);
    case "video":
    case "file":
    case "pdf":
      return renderFileLink(value as NotionFileValue, block.type);
    case "bookmark":
    case "link_preview":
      return renderBookmark(value as { caption?: NotionRichText[]; url?: string });
    case "code":
      return `<pre><code>${escapeHtml(richTextToPlain(richText))}</code></pre>`;
    case "table":
      return renderTable(children);
    case "table_row":
      return renderTableRow(value as { cells?: NotionRichText[][] });
    case "child_page":
      return value.title ? `<h3 id="${escapeHtml(blockAnchorId(String(value.title)))}">${escapeHtml(String(value.title))}</h3>` : "";
    default:
      return children;
  }
}

async function renderList(blocks: NotionBlock[], startIndex: number, loadChildren: (blockId: string) => Promise<NotionBlock[]>) {
  const type = blocks[startIndex].type;
  const tag = type === "numbered_list_item" ? "ol" : "ul";
  const items: string[] = [];
  let index = startIndex;

  while (index < blocks.length && blocks[index].type === type) {
    const block = blocks[index];
    const value = (block[type] || {}) as { rich_text?: NotionRichText[] };
    const text = richTextToHtml(value.rich_text || []);
    const children = block.has_children ? await blocksToHtml(await loadChildren(block.id), loadChildren) : "";
    items.push(`<li>${text}${children}</li>`);
    index += 1;
  }

  return { markup: `<${tag}>${items.join("")}</${tag}>`, nextIndex: index };
}

function renderMediaFigure(value: NotionFileValue) {
  const src = value.external?.url ?? value.file?.url;
  const caption = richTextToPlain(value.caption || []);
  if (!src) return "";
  return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

function renderFileLink(value: NotionFileValue, label: string) {
  const href = value.external?.url ?? value.file?.url;
  const caption = richTextToPlain(value.caption || []) || value.name || label;
  if (!href) return "";
  return `<p><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(caption)}</a></p>`;
}

function renderBookmark(value: { caption?: NotionRichText[]; url?: string }) {
  const href = value.url;
  const caption = richTextToPlain(value.caption || []) || href;
  if (!href) return "";
  return `<p><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(caption)}</a></p>`;
}

function renderTable(children: string) {
  return children ? `<div class="guide-table-wrap"><table class="guide-table"><tbody>${children}</tbody></table></div>` : "";
}

function renderTableRow(value: { cells?: NotionRichText[][] }) {
  const cells = value.cells || [];
  return `<tr>${cells.map((cell) => `<td>${richTextToHtml(cell)}</td>`).join("")}</tr>`;
}

function iconMarkup(icon: unknown) {
  const value = icon as { emoji?: string; type?: string } | undefined;
  return value?.type === "emoji" && value.emoji ? `<span>${escapeHtml(value.emoji)}</span>` : "";
}

function notionColorToStyle(color: string) {
  const textColors: Record<string, string> = {
    blue: "#2f5f85",
    brown: "#7c4a2d",
    gray: "#78716c",
    green: "#3f7a4b",
    orange: "#b45309",
    pink: "#a7446f",
    purple: "#6d5b95",
    red: "#a54d37",
    yellow: "#a16207"
  };
  const backgroundColors: Record<string, string> = {
    blue_background: "#e5f0f6",
    brown_background: "#f4ece5",
    gray_background: "#f4f1ed",
    green_background: "#e8f2e6",
    orange_background: "#fbebd7",
    pink_background: "#f8e7ef",
    purple_background: "#eee9f6",
    red_background: "#f9e7e3",
    yellow_background: "#fbf1c7"
  };

  if (textColors[color]) return `color: ${textColors[color]};`;
  if (backgroundColors[color]) return `background-color: ${backgroundColors[color]};`;
  return "";
}
