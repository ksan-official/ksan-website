import { Fragment, type ReactNode } from "react";
import { ArrowUpRight, Check, FileText, ImageIcon } from "lucide-react";
import type { GuideBlock, GuideRichText } from "@/lib/types";

export function guideHeadingId(block: GuideBlock) {
  return `section-${block.id.replace(/[^a-zA-Z0-9가-힣_-]/g, "-")}`;
}

export function flattenGuideBlocks(blocks: GuideBlock[]): GuideBlock[] {
  return blocks.flatMap((block) => [block, ...flattenGuideBlocks(block.children ?? [])]);
}

function safeColorClass(color?: string) {
  if (!color || !/^[a-z_]+$/.test(color)) return "";
  return ` notion-rich-text--${color.replace(/_/g, "-")}`;
}

function RichText({ fallback, segments }: { fallback: string; segments?: GuideRichText[] }) {
  const content = segments?.length ? segments : [{ text: fallback }];
  return content.map((segment, index) => {
    let node: ReactNode = segment.text;
    if (segment.code) node = <code>{node}</code>;
    if (segment.bold) node = <strong>{node}</strong>;
    if (segment.italic) node = <em>{node}</em>;
    if (segment.underline) node = <u>{node}</u>;
    if (segment.strikethrough) node = <s>{node}</s>;
    if (segment.href) {
      node = (
        <a href={segment.href} rel="noreferrer" target={segment.href.startsWith("http") ? "_blank" : undefined}>
          {node}
        </a>
      );
    }
    return <Fragment key={`${segment.text}-${index}`}><span className={safeColorClass(segment.color)}>{node}</span></Fragment>;
  });
}

function BlockChildren({ block }: { block: GuideBlock }) {
  return block.children?.length ? <GuideNotionContent blocks={block.children} nested /> : null;
}

function renderBlock(block: GuideBlock) {
  const text = <RichText fallback={block.text} segments={block.richText} />;
  if (block.type === "heading_1") {
    return <h2 className="article-heading article-heading--1" id={guideHeadingId(block)} key={block.id}>{text}</h2>;
  }
  if (block.type === "heading_2") {
    return <h3 className="article-heading article-heading--2" id={guideHeadingId(block)} key={block.id}>{text}</h3>;
  }
  if (block.type === "heading_3") {
    return <h4 className="article-heading article-heading--3" id={guideHeadingId(block)} key={block.id}>{text}</h4>;
  }
  if (block.type === "paragraph") {
    return <div className="notion-paragraph-wrap" key={block.id}><p>{text}</p><BlockChildren block={block} /></div>;
  }
  if (block.type === "quote") {
    return <blockquote className="notion-quote" key={block.id}>{text}<BlockChildren block={block} /></blockquote>;
  }
  if (block.type === "callout") {
    return (
      <aside className={`notion-callout${safeColorClass(block.color)}`} key={block.id}>
        <span aria-hidden className="notion-callout-icon">{block.icon ?? "💡"}</span>
        <div><p>{text}</p><BlockChildren block={block} /></div>
      </aside>
    );
  }
  if (block.type === "toggle") {
    return <details className="notion-toggle" key={block.id}><summary>{text}</summary><BlockChildren block={block} /></details>;
  }
  if (block.type === "to_do") {
    return (
      <div className={`notion-todo${block.checked ? " is-checked" : ""}`} key={block.id}>
        <span aria-hidden>{block.checked ? <Check size={14} /> : null}</span>
        <p>{text}</p>
        <BlockChildren block={block} />
      </div>
    );
  }
  if (block.type === "code") {
    return (
      <div className="notion-code" key={block.id}>
        {block.language ? <span>{block.language}</span> : null}
        <pre><code>{block.text}</code></pre>
      </div>
    );
  }
  if (block.type === "divider") return <hr className="notion-divider" key={block.id} />;
  if (block.type === "image" && block.url) {
    return (
      <figure className="notion-image" key={block.id}>
        {/* Notion-hosted file URLs are temporary and cannot be known in next.config ahead of time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={block.text || "가이드 이미지"} loading="lazy" src={block.url} />
        {block.caption?.length ? <figcaption><ImageIcon aria-hidden size={14} /><RichText fallback="" segments={block.caption} /></figcaption> : null}
      </figure>
    );
  }
  if ((block.type === "bookmark" || block.type === "file") && block.url) {
    return (
      <a className="notion-bookmark" href={block.url} key={block.id} rel="noreferrer" target="_blank">
        <span>{block.type === "file" ? <FileText aria-hidden size={19} /> : <ArrowUpRight aria-hidden size={19} />}</span>
        <div><strong>{block.text || block.url}</strong><small>{block.url}</small></div>
        <ArrowUpRight aria-hidden size={18} />
      </a>
    );
  }
  return null;
}

export function GuideNotionContent({ blocks, nested = false }: { blocks: GuideBlock[]; nested?: boolean }) {
  const nodes: ReactNode[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const type = block.type;
      const items: GuideBlock[] = [];
      while (index < blocks.length && blocks[index].type === type) {
        items.push(blocks[index]);
        index += 1;
      }
      index -= 1;
      const List = type === "bulleted_list_item" ? "ul" : "ol";
      nodes.push(
        <List className="notion-list" key={`${type}-${items[0].id}`}>
          {items.map((item) => (
            <li key={item.id}>
              <span><RichText fallback={item.text} segments={item.richText} /></span>
              <BlockChildren block={item} />
            </li>
          ))}
        </List>
      );
      continue;
    }
    nodes.push(renderBlock(block));
  }

  return <div className={nested ? "notion-block-children" : "notion-content"}>{nodes}</div>;
}
