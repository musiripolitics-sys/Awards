export type ProjectKey =
  | "club-service-1"
  | "club-service-2"
  | "professional-1"
  | "professional-2"
  | "community-1"
  | "community-2"
  | "international-1"
  | "international-2"
  | "ongoing"
  | "legacy"
  | "joint"
  | "multi-avenue"
  | "public-image"
  | "innovative";

export const PROJECT_SECTIONS: {
  key: ProjectKey;
  title: string;
  avenue: string;
  description: string;
  note?: string;
  noteType?: "warning" | "info";
}[] = [
  {
    key: "club-service-1",
    title: "Club Service Project 1",
    avenue: "Club Service",
    description: "A project that strengthened club fellowship, governance or member engagement.",
    note: "Must have been conducted after 7 December 2025. Projects before this date are not eligible.",
    noteType: "warning",
  },
  {
    key: "club-service-2",
    title: "Club Service Project 2",
    avenue: "Club Service",
    description: "Your second Club Service project from the year.",
    note: "Secondary nomination — any time in the rotary year 2025-26.",
    noteType: "info",
  },
  {
    key: "professional-1",
    title: "Professional Service Project 1",
    avenue: "Professional",
    description: "A project that empowered Rotaractors with skills, careers or professional growth.",
    note: "Must have been conducted after 7 December 2025. Projects before this date are not eligible.",
    noteType: "warning",
  },
  {
    key: "professional-2",
    title: "Professional Service Project 2",
    avenue: "Professional",
    description: "Your second professional development project.",
    note: "Can be from any time during the rotary year 2025-26, no date restriction.",
    noteType: "info",
  },
  {
    key: "community-1",
    title: "Community Service Project 1",
    avenue: "Community",
    description: "A community-facing project that delivered transformational impact.",
    note: "Must have been conducted after 7 December 2025. Projects before this date are not eligible.",
    noteType: "warning",
  },
  {
    key: "community-2",
    title: "Community Service Project 2",
    avenue: "Community",
    description: "Your second community service project from the year.",
    note: "Secondary nomination — any time in the rotary year 2025-26.",
    noteType: "info",
  },
  {
    key: "international-1",
    title: "International Service Project 1",
    avenue: "International",
    description: "A cross-border collaboration promoting peace and understanding.",
    note: "Must have been conducted after 7 December 2025. Projects before this date are not eligible.",
    noteType: "warning",
  },
  {
    key: "international-2",
    title: "International Service Project 2",
    avenue: "International",
    description: "Your second international service project from the year.",
    note: "Secondary nomination — any time in the rotary year 2025-26.",
    noteType: "info",
  },
  {
    key: "ongoing",
    title: "Ongoing Project",
    avenue: "Long-running",
    description: "A long-running initiative still delivering impact through this year.",
  },
  {
    key: "legacy",
    title: "Legacy Project",
    avenue: "Long-running",
    description: "A project built to outlive any single rotary year.",
  },
  {
    key: "joint",
    title: "Joint Project",
    avenue: "Collaboration",
    description: "An exceptional joint project with another Rotaract or Rotary club.",
  },
  {
    key: "multi-avenue",
    title: "Multi-Avenue Project",
    avenue: "Cross-avenue",
    description: "A flagship that meaningfully spans more than one avenue of service.",
  },
  {
    key: "public-image",
    title: "Public Image Project",
    avenue: "Public Image",
    description: "A project that elevated the public image of Rotary or Rotaract.",
  },
  {
    key: "innovative",
    title: "Innovative Project",
    avenue: "Innovation",
    description:
      "A bold, creative idea or first-of-its-kind execution that redefined how the club delivered service.",
  },
];

export const DISTRICT_EVENTS_CLUB = [
  "Pharos – Community Based Club's Meeting",
  "Crescendo – PELS & SELS",
  "Spark – DOLS",
  "Odyssey – LLS",
  "District Installation – Retro",
  "District Assembly – Ignite",
  "District Cultural – Josh",
  "District RYLA – ONE",
  "District Half Yearly Awards – Amplifive",
  "Rotasia 2026",
  "Roto Olympics",
];

// Recommendation B applied — Spark – DOLS is included for officers too.
export const DISTRICT_EVENTS_OFFICER = DISTRICT_EVENTS_CLUB;

export const DISTRICT_INITIATIVES = [
  "7 Stones Tournament",
  "Christ Mom Christ Child",
  "Padayappa movie re-release",
  "Colour Galata",
  "AI Horizons",
  "Lifeline – CPR & Basic Life Support Training",
  "Shores of Tomorrow (Beach Clean-up)",
  "Insight Connect",
  "Namma Ooru Namma Chennai – RIDE",
  "Level Up – District Job Fair",
];

export const ROTARY_INITIATIVES = [
  "Arivarangam 2025 – DLS (Rotary Assembly)",
  "Lead – Rotary Conclave",
  "Rotary Diwali",
  "Indra Vizha – Rotary Conference",
];

export const FLOW: { id: string; group: string; title: string; subtitle: string }[] = [
  { id: "identity", group: "Begin", title: "Club Identity", subtitle: "Self-identify your club to begin." },
  { id: "docs", group: "Eligibility", title: "Document Validation", subtitle: "Confirm dues and (for community clubs) bank account." },
  ...PROJECT_SECTIONS.map((p) => ({
    id: `project:${p.key}`,
    group: "Project Nominations",
    title: p.title,
    subtitle: p.description,
  })),
  { id: "club-award", group: "Club Awards", title: "Club Award Nomination", subtitle: "Your club's year, in numbers and words." },
  { id: "social-media", group: "Club Awards", title: "Social Media Handling", subtitle: "How the club showed up online." },
  { id: "best-practice", group: "Club Awards", title: "Practice Award", subtitle: "An operational practice that lifted quality." },
  { id: "president", group: "Officer Awards", title: "President Self-Evaluation", subtitle: "To be filled by the Club President." },
  { id: "secretary", group: "Officer Awards", title: "Secretary Self-Evaluation", subtitle: "To be filled by the Club Secretary." },
  { id: "star-of-rotaract", group: "Member Recognition", title: "Star of Rotaract", subtitle: "Nominate two members for individual recognition." },
  { id: "declaration", group: "Submit", title: "Declaration & Save", subtitle: "Review, sign, and save it to the jury." },
];

export type FlowEntry = (typeof FLOW)[number];
