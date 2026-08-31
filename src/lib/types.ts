export type UserRole = "user" | "admin";

export type GuideSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId?: string;
  summary: string;
  updatedAt: string;
  author: string;
  tags: string[];
};

export type GuideRichText = {
  text: string;
  href?: string | null;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
};

export type GuideBlockType =
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "paragraph"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "quote"
  | "callout"
  | "toggle"
  | "to_do"
  | "code"
  | "divider"
  | "image"
  | "bookmark"
  | "file"
  | "html"
  | "table";

export type GuideBlock = {
  id: string;
  type: GuideBlockType;
  text: string;
  richText?: GuideRichText[];
  children?: GuideBlock[];
  checked?: boolean;
  icon?: string;
  color?: string;
  url?: string;
  name?: string;
  caption?: GuideRichText[];
  language?: string;
  html?: string;
  rows?: string[][];
  hasColumnHeader?: boolean;
  hasRowHeader?: boolean;
};

export type GuideDetail = GuideSummary & {
  blocks: GuideBlock[];
  related: GuideSummary[];
};

export type BusinessPost = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  deadline: string | null;
  applyMode: "email" | "external_link" | "internal_form";
  applyTarget: string;
  description: string;
};

export type EventPost = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  description: string;
  registrationMode: "google_form" | "external_link" | "internal_form";
  registrationTarget: string;
};
