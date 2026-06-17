"use client";

import { useMemo, useState } from "react";
import { CATEGORY_GROUPS, CATEGORIES } from "@/lib/categories";
import AwardIcon from "@/components/AwardIcon";

type Winner = {
  id: string;
  year: string;
  categoryId: string;
  name: string;
  subtitle: string;
  story: string;
  club: string;
  accent: string;
};

const WINNERS: Winner[] = [
  {
    id: "w1",
    year: "2024-25",
    categoryId: "signature-project",
    name: "Bridges of Light",
    subtitle: "Solar electrification across the Western Ghats",
    story: "1,247 rural homes lit, 38 women trained as solar technicians, 6 villages reconnected to the grid.",
    club: "RC Bengaluru Midtown",
    accent: "from-[#d6ba73] to-[#a8893e]",
  },
  {
    id: "w2",
    year: "2024-25",
    categoryId: "rotaractor-of-the-year",
    name: "Rtr. Mira Pinto",
    subtitle: "Rotaractor of the Year",
    story: "Mentored 26 secretaries across the district and authored the office-bearer handbook now used in 41 clubs.",
    club: "RC Mangalore Coastal",
    accent: "from-[#e8d49a] to-[#d6ba73]",
  },
  {
    id: "w3",
    year: "2024-25",
    categoryId: "best-club-overall",
    name: "RC Bengaluru Midtown",
    subtitle: "Best Rotaract Club — Overall",
    story: "Eight signature projects, ₹46L mobilised, a 38% growth in membership and zero attrition through the year.",
    club: "Charter 2014",
    accent: "from-[#f4ead5] to-[#d6ba73]",
  },
  {
    id: "w4",
    year: "2024-25",
    categoryId: "innovation-award",
    name: "AsthmaScope",
    subtitle: "AI inhaler-technique coach",
    story: "An on-device computer vision app that helped 612 asthmatic children improve inhaler technique by 38%.",
    club: "RC Hyderabad Pearl",
    accent: "from-[#d6ba73] to-[#a8893e]",
  },
  {
    id: "w5",
    year: "2023-24",
    categoryId: "community-service",
    name: "Project Nourish",
    subtitle: "Community kitchen network",
    story: "A 12-city kitchen network serving 18,000 daily meals to migrant workers — still running on its own steam.",
    club: "RC Chennai Marina",
    accent: "from-[#e8d49a] to-[#d6ba73]",
  },
  {
    id: "w6",
    year: "2023-24",
    categoryId: "president-of-the-year",
    name: "Rtr. Arjun Bhatt",
    subtitle: "President of the Year",
    story: "Took a 12-member club to 47 members in one year while delivering five flagship projects.",
    club: "RC Pune Riverside",
    accent: "from-[#d6ba73] to-[#a8893e]",
  },
  {
    id: "w7",
    year: "2023-24",
    categoryId: "international-service",
    name: "Project Pen Pal Earth",
    subtitle: "Best International Service Project",
    story: "Linked 600 children across 14 countries through a year-long climate letter-writing exchange.",
    club: "RC Cochin Harbour",
    accent: "from-[#f4ead5] to-[#d6ba73]",
  },
  {
    id: "w8",
    year: "2022-23",
    categoryId: "public-image",
    name: "#FacesOfService",
    subtitle: "Excellence in Public Image",
    story: "A year-long documentary series that hit 4.2M views and reframed how the district told its story.",
    club: "RC Mumbai Worli",
    accent: "from-[#e8d49a] to-[#d6ba73]",
  },
];

const YEARS = Array.from(new Set(WINNERS.map((w) => w.year))).sort().reverse();

export default function WinnersGrid() {
  const [year, setYear] = useState<string>("all");
  const [group, setGroup] = useState<string>("all");

  const filtered = useMemo(() => {
    return WINNERS.filter((w) => {
      if (year !== "all" && w.year !== year) return false;
      if (group !== "all") {
        const cat = CATEGORIES.find((c) => c.id === w.categoryId);
        if (!cat || cat.group !== group) return false;
      }
      return true;
    });
  }, [year, group]);

  return (
    <section className="relative pb-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3 mb-10">
          <span className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.55)] mr-2">
            Filter
          </span>
          <FilterPill
            label="All years"
            active={year === "all"}
            onClick={() => setYear("all")}
          />
          {YEARS.map((y) => (
            <FilterPill
              key={y}
              label={y}
              active={year === y}
              onClick={() => setYear(y)}
            />
          ))}
          <span className="mx-2 h-5 w-px bg-[rgba(214,186,115,0.25)]" />
          <FilterPill
            label="All groups"
            active={group === "all"}
            onClick={() => setGroup("all")}
          />
          {CATEGORY_GROUPS.map((g) => (
            <FilterPill
              key={g.key}
              label={g.label.replace(" Awards", "")}
              active={group === g.key}
              onClick={() => setGroup(g.key)}
            />
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((w, i) => {
            const cat = CATEGORIES.find((c) => c.id === w.categoryId);
            return (
              <article
                key={w.id}
                className="relative group glass-strong rounded-3xl overflow-hidden animate-rise"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="relative h-44 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${w.accent} opacity-40`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(244,234,213,0.4),transparent_55%)]" />
                  <div className="absolute inset-0 grain opacity-100" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="relative">
                      <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(244,234,213,0.5),transparent_55%)] blur-2xl" />
                      <div className="relative w-20 h-20 rounded-full grid place-items-center bg-[rgba(10,13,24,0.55)] border border-[rgba(244,234,213,0.5)]">
                        <AwardIcon name={cat?.icon || "trophy"} className="w-10 h-10" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 chip bg-[rgba(10,13,24,0.55)]">{w.year}</div>
                </div>
                <div className="p-6">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
                    {cat?.title || w.subtitle}
                  </div>
                  <h3 className="mt-2 font-display text-2xl text-[rgba(244,234,213,0.95)] leading-tight">
                    {w.name}
                  </h3>
                  <div className="text-sm text-[rgba(244,234,213,0.6)] mt-1">{w.club}</div>
                  <p className="mt-4 text-sm text-[rgba(244,234,213,0.75)] leading-relaxed">
                    {w.story}
                  </p>
                </div>
                <div className="hairline-top px-6 py-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.55)]">
                  <span>{cat?.group} Award</span>
                  <span className="text-[#e8d49a]">★ Winner</span>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-[rgba(244,234,213,0.55)]">
            No winners match this filter — try widening the search.
          </div>
        )}
      </div>
    </section>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs border transition ${
        active
          ? "border-[#d6ba73] bg-[rgba(214,186,115,0.15)] text-[#f4ead5]"
          : "border-[rgba(214,186,115,0.18)] text-[rgba(244,234,213,0.7)] hover:border-[rgba(214,186,115,0.4)]"
      }`}
    >
      {label}
    </button>
  );
}
