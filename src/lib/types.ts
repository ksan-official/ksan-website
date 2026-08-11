export type UserRole = "user" | "admin";

export type GuideSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  updatedAt: string;
  author: string;
  tags: string[];
};

export type GuideBlock =
  | { id: string; type: "heading_1" | "heading_2" | "heading_3"; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "bulleted_list_item" | "numbered_list_item"; text: string }
  | { id: string; type: "quote" | "callout"; text: string };

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
