export type CategoryGroup = "Project" | "Club" | "Officer" | "Member";

export type AwardCategory = {
  id: string;
  title: string;
  group: CategoryGroup;
  blurb: string;
  icon: string;
};

export const CATEGORIES: AwardCategory[] = [
  // Project Awards (10) — best across the avenues
  { id: "best-club-service-project", title: "Club Service Project", group: "Project", blurb: "Strengthening fellowship, governance and member engagement within the club.", icon: "handshake" },
  { id: "best-professional-service-project", title: "Professional Service Project", group: "Project", blurb: "Empowering Rotaractors with skills, careers and professional growth.", icon: "briefcase" },
  { id: "best-community-service-project", title: "Community Service Project", group: "Project", blurb: "Transformational impact on the communities we serve.", icon: "globe" },
  { id: "best-international-service-project", title: "International Service Project", group: "Project", blurb: "Cross-border collaborations promoting peace and understanding.", icon: "compass" },
  { id: "best-ongoing-project", title: "Ongoing Project", group: "Project", blurb: "A long-running initiative still delivering meaningful impact.", icon: "scroll" },
  { id: "best-legacy-project", title: "Legacy Project", group: "Project", blurb: "A project that will outlive any single rotary year.", icon: "diamond" },
  { id: "best-joint-project", title: "Joint Project", group: "Project", blurb: "Outstanding collaboration with another club or partner.", icon: "handshake" },
  { id: "best-multi-avenue-project", title: "Multi-Avenue Project", group: "Project", blurb: "A flagship that touches more than one avenue of service.", icon: "spark" },
  { id: "best-public-image-project", title: "Public Image Project", group: "Project", blurb: "Storytelling that elevated Rotary or Rotaract in the public eye.", icon: "camera" },
  { id: "best-innovative-project", title: "Innovative Project", group: "Project", blurb: "A bold, creative idea that redefined how we deliver service.", icon: "sparkle" },

  // Club Awards (4)
  { id: "best-rotaract-club", title: "Rotaract Club of the Year", group: "Club", blurb: "The district's highest recognition for an exemplary club.", icon: "trophy" },
  { id: "best-social-media", title: "Social Media Handling", group: "Club", blurb: "Outstanding storytelling, engagement and consistency online.", icon: "camera" },
  { id: "best-practice-award", title: "Practice Award", group: "Club", blurb: "An operational practice that lifted club quality and performance.", icon: "medal" },

  // Officer Awards (2)
  { id: "president-of-the-year", title: "President of the Year", group: "Officer", blurb: "Visionary leadership that elevated a club to new heights.", icon: "crown" },
  { id: "secretary-of-the-year", title: "Secretary of the Year", group: "Officer", blurb: "Excellence in documentation, communication and coordination.", icon: "scroll" },

  // Member Recognition (1)
  { id: "star-of-rotaract", title: "Star of Rotaract", group: "Member", blurb: "An individual Rotaractor whose contribution stood apart.", icon: "star" },
];

export const CATEGORY_GROUPS: { key: CategoryGroup; label: string; tagline: string }[] = [
  { key: "Project", label: "Project Awards", tagline: "Honouring flagship projects across every avenue of service" },
  { key: "Club", label: "Club Awards", tagline: "Recognising the institutions that hold the district together" },
  { key: "Officer", label: "Officer Awards", tagline: "Celebrating presidents and secretaries who led from the front" },
  { key: "Member", label: "Member Recognition", tagline: "Saluting the individuals who quietly carried the district forward" },
];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}
