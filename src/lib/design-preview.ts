// Local design review uses fictional records and never creates an authenticated session.
export const isLocalDesignMode = process.env.NODE_ENV === "development";

export const designProfile = {
  avatar_url: null,
  full_name: "운하산책",
  school: "University of Amsterdam",
  major: "Communication Science",
  admission_year: 2026
};

export const designSavedGuides = [
  { slug: "settlement-checklist-netherlands", title: "정착 체크리스트", category: "처음 정착하기", savedAt: "2026-10-18T12:00:00Z" }
];
