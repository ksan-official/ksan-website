import type { ReactNode } from "react";

type BusinessFormattedBodyProps = {
  body: string;
  language?: string;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function decodeEscapedTags(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function demoteAccidentalPasteFormatting(value: string) {
  const fullTextLength = stripTags(value).length;
  if (fullTextLength < 160) return value;

  const headingTextLength = Array.from(value.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi))
    .reduce((total, match) => total + stripTags(match[1] ?? "").length, 0);
  const strongTextLength = Array.from(value.matchAll(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi))
    .reduce((total, match) => total + stripTags(match[2] ?? "").length, 0);

  const shouldDemoteHeadings = headingTextLength / fullTextLength > 0.45;
  const shouldDemoteStrong = strongTextLength / fullTextLength > 0.6;

  let nextValue = value;
  if (shouldDemoteHeadings) {
    nextValue = nextValue.replace(/<(\/?)h[23]\b[^>]*>/gi, "<$1p>");
  }
  if (shouldDemoteStrong) {
    nextValue = nextValue.replace(/<\/?(strong|b)\b[^>]*>/gi, "");
  }
  return nextValue;
}

function sanitizeRichHtml(value: string) {
  return demoteAccidentalPasteFormatting(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\/?)div\b[^>]*>/gi, "<$1p>")
    .replace(/<(\/?)section\b[^>]*>/gi, "<$1p>")
    .replace(/<\/?(span|font|meta|xml|o:p)\b[^>]*>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/\s+style="[^"]*"/gi, "")
    .replace(/\s+style='[^']*'/gi, "")
    .replace(/\s+href=["']\s*javascript:[^"']*["']/gi, " href=\"#\"")
    .replace(/<\/?(?!p\b|br\b|h2\b|h3\b|ul\b|ol\b|li\b|strong\b|b\b|em\b|i\b|u\b|s\b|blockquote\b|hr\b|a\b)[a-z][^>]*>/gi, "")
    .replace(/<a\b(?![^>]*\bhref=)[^>]*>/gi, "")
    .replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
      const href = String(attrs).match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "#";
      const safeHref = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") ? href : "#";
      return `<a href="${safeHref}" rel="noreferrer" target="_blank">`;
    })
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");
}

function htmlToPlainBody(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_match, attrs: string, label: string) => {
      const href = String(attrs).match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "";
      const cleanLabel = stripTags(label);
      const safeHref = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") ? href : "";
      return safeHref ? `${cleanLabel} (${safeHref})` : cleanLabel;
    })
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|<u>.*?<\/u>|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("~~")) {
      nodes.push(<s key={key}>{token.slice(2, -2)}</s>);
    } else if (token.startsWith("<u>")) {
      nodes.push(<u key={key}>{token.slice(3, -4)}</u>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = linkMatch?.[2] ?? "";
      const safeHref = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") ? href : "#";
      nodes.push(<a href={safeHref} key={key} rel="noreferrer" target="_blank">{linkMatch?.[1] ?? token}</a>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function isOrderedItem(line: string) {
  return /^\d+\.\s+/.test(line);
}

function isChecklistItem(line: string) {
  return /^[□☐◻]\s*/.test(line);
}

function isCircledNumberItem(line: string) {
  return /^[①②③④⑤⑥⑦⑧⑨⑩]\s*/.test(line);
}

function isNoteLine(line: string) {
  return /^[※*]\s+/.test(line) || line.startsWith("※");
}

function isSoftHeading(line: string) {
  const cleanedLine = line.replace(/[:：]+$/, "");
  return line.endsWith(":") && cleanedLine.length <= 32;
}

function stripChecklistMarker(line: string) {
  return line.replace(/^[□☐◻]\s*/, "");
}

function stripCircledNumber(line: string) {
  return line.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, "");
}

function stripNoteMarker(line: string) {
  return line.replace(/^※\s*/, "").replace(/^\*\s+/, "");
}

function hasStructuredJobMarkers(value: string) {
  return /(^|\n)\s*([□☐◻①②③④⑤⑥⑦⑧⑨⑩]|※)/.test(value);
}

function renderPlainBody(body: string) {
  const lines = body.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listItems.length || !listType) return;
    const Tag = listType;
    elements.push(
      <Tag key={`list-${elements.length}`} className="business-detail-rich-list">
        {listItems.map((item, index) => <li key={`${item}-${index}`}>{renderInline(item)}</li>)}
      </Tag>
    );
    listItems = [];
    listType = null;
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    if (line === "---") {
      flushList();
      elements.push(<hr key={`hr-${index}`} />);
      return;
    }

    if (line.startsWith("- ")) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(line.slice(2));
      return;
    }

    if (isOrderedItem(line)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushList();

    if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${index}`}>{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${index}`}>{renderInline(line.slice(4))}</h3>);
    } else if (isChecklistItem(line)) {
      elements.push(
        <div className="business-detail-check-row" key={`check-${index}`}>
          <span aria-hidden="true" />
          <p>{renderInline(stripChecklistMarker(line))}</p>
        </div>
      );
    } else if (isCircledNumberItem(line)) {
      elements.push(
        <div className="business-detail-step-row" key={`step-${index}`}>
          <span aria-hidden="true">{line.charAt(0)}</span>
          <p>{renderInline(stripCircledNumber(line))}</p>
        </div>
      );
    } else if (isNoteLine(line)) {
      elements.push(
        <p className="business-detail-note" key={`note-${index}`}>
          {renderInline(stripNoteMarker(line))}
        </p>
      );
    } else if (isSoftHeading(line)) {
      elements.push(<h3 key={`soft-h3-${index}`}>{renderInline(line.replace(/[:：]+$/, ""))}</h3>);
    } else if (line.startsWith("> ")) {
      elements.push(<blockquote key={`quote-${index}`}>{renderInline(line.slice(2))}</blockquote>);
    } else {
      elements.push(<p key={`p-${index}`}>{renderInline(line)}</p>);
    }
  });
  flushList();

  return elements;
}

export function BusinessFormattedBody({ body, language }: BusinessFormattedBodyProps) {
  const normalizedBody = body.includes("&lt;") ? decodeEscapedTags(body) : body;

  if (looksLikeHtml(normalizedBody)) {
    const plainBody = htmlToPlainBody(normalizedBody);
    if (hasStructuredJobMarkers(plainBody)) {
      return <div className="business-detail-body" lang={language}>{renderPlainBody(plainBody)}</div>;
    }

    return (
      <div
        className="business-detail-body"
        lang={language}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(normalizedBody) }}
      />
    );
  }

  return <div className="business-detail-body" lang={language}>{renderPlainBody(normalizedBody)}</div>;
}
