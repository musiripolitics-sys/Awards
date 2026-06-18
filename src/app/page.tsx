import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ParticleField from "@/components/ParticleField";
import AwardIcon from "@/components/AwardIcon";
import NominationCounter from "@/components/NominationCounter";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/categories";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="relative">
        <Hero />
        <Marquee />
        <Stats />
        <About />
        <Categories />
        <Process />
        <Spotlight />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden spotlight grain pt-16 pb-24 sm:pb-32">
      <ParticleField count={28} />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 text-center">
        <div className="inline-flex items-center gap-2 chip mb-8 animate-rise">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d6ba73] animate-pulse-gold" />
          District Rotaract Council Presents
        </div>

        <h1
          className="font-display text-[44px] sm:text-[68px] md:text-[88px] leading-[1.02] tracking-tight animate-rise"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="block gold-text">IGNUS</span>
          <span className="block text-[rgba(244,234,213,0.92)] text-[28px] sm:text-[40px] md:text-[52px] mt-2">Annual District Rotaract Awards</span>
        </h1>

        <p
          className="mt-7 mx-auto max-w-2xl text-[15px] sm:text-base text-[rgba(244,234,213,0.7)] leading-relaxed animate-rise"
          style={{ animationDelay: "0.15s" }}
        >
          IGNUS — the Annual District Rotaract Awards 2025-26 — celebrates the projects, presidents,
          and clubs that delivered outstanding impact across every avenue of service. Submit your
          nomination and let the district recognise the work that truly made a difference.
        </p>

        <div
          className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center animate-rise"
          style={{ animationDelay: "0.25s" }}
        >
          <Link
            href="/nominate"
            className="btn-gold w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide"
          >
            Begin a Nomination →
          </Link>
          <Link
            href="#about"
            className="btn-ghost w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-medium tracking-wide"
          >
            About the Awards
          </Link>
        </div>

        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.45)] animate-rise"
          style={{ animationDelay: "0.35s" }}
        >
          <span>Submissions close · 21 Jun 2026</span>
          <span className="hidden sm:inline">·</span>
          <span>Ceremony · 27 Jun 2026</span>
          <span className="hidden sm:inline">·</span>
          <span>Venue · Gyan Bhavan, AM Jain</span>
        </div>

        <TrophyMark />
      </div>
    </section>
  );
}

function TrophyMark() {
  return (
    <div className="relative mt-20 flex justify-center">
      <div className="relative">
        <div className="absolute -inset-20 rounded-full bg-[radial-gradient(circle,rgba(214,186,115,0.18),transparent_60%)] blur-2xl" />
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 grid place-items-center rounded-full glass-strong ring-gold">
          <div className="absolute inset-3 rounded-full border border-[rgba(214,186,115,0.25)]" />
          <div className="absolute inset-6 rounded-full border border-[rgba(214,186,115,0.18)]" />
          <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-28 sm:h-28">
            <defs>
              <linearGradient id="gld" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4ead5" />
                <stop offset="50%" stopColor="#d6ba73" />
                <stop offset="100%" stopColor="#a8893e" />
              </linearGradient>
            </defs>
            <path d="M30 14h40l-4 24c-2 12-12 18-16 18s-14-6-16-18l-4-24z" fill="url(#gld)" />
            <path d="M22 18h-6v6c0 6 5 12 14 14" stroke="#d6ba73" strokeWidth="2" fill="none" />
            <path d="M78 18h6v6c0 6-5 12-14 14" stroke="#d6ba73" strokeWidth="2" fill="none" />
            <rect x="42" y="56" width="16" height="8" fill="#d6ba73" />
            <rect x="34" y="64" width="32" height="6" rx="1" fill="url(#gld)" />
            <rect x="30" y="70" width="40" height="4" rx="1" fill="#a8893e" />
            <circle cx="50" cy="30" r="3" fill="#0a0d18" opacity="0.4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Marquee() {
  const items = [
    "Service Above Self",
    "Fellowship",
    "Integrity",
    "Diversity",
    "Leadership",
    "Innovation",
    "Impact",
  ];
  return (
    <section className="relative border-y border-[rgba(214,186,115,0.14)] py-5 overflow-hidden">
      <div className="flex gap-12 whitespace-nowrap">
        <div className="flex gap-12 animate-marquee">
          {[...items, ...items, ...items].map((it, i) => (
            <span
              key={i}
              className="flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-[rgba(244,234,213,0.55)]"
            >
              <span className="inline-block w-1 h-1 rounded-full bg-[#d6ba73]" />
              {it}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
      `}</style>
    </section>
  );
}

function Stats() {
  const fixedStats = [
    { v: "25+", l: "Award Categories" },
    { v: "27", l: "Form Sections" },
    { v: "1 night", l: "Of unforgettable recognition" },
  ];
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <NominationCounter />
        {fixedStats.map((s) => (
          <div
            key={s.l}
            className="glass rounded-2xl p-6 text-center relative overflow-hidden"
          >
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-[#d6ba73] to-transparent" />
            <div className="font-display text-4xl sm:text-5xl gold-text">{s.v}</div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.55)]">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="About the Awards"
          title={
            <>
              <span className="text-[rgba(244,234,213,0.92)]">The district's highest</span>{" "}
              <span className="gold-text">annual honour.</span>
            </>
          }
          subtitle="IGNUS — the Annual District Rotaract Awards 2025-26 — is the official recognition for the clubs, projects, presidents and members who carried the spirit of Service Above Self through the rotary year. Every entry is reviewed by an independent jury — your work is the only currency that matters here."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-5">
          <AboutCard
            eyebrow="Who can nominate"
            title="Every chartered Rotaract club."
            body="Self-nomination by chartered Rotaract clubs of RI District 3233. College-based and community-based clubs follow tailored paths through the same form."
          />
          <AboutCard
            eyebrow="What's eligible"
            title="Dues paid. Bank account active."
            body="Clubs must have paid RI and District dues for 2025-26. Community-based clubs must also hold an active bank account with proof of operation."
          />
          <AboutCard
            eyebrow="How it works"
            title="One form. Every honour."
            body="A single guided form covers project nominations, club performance, officer evaluations and member recognitions. Save your draft and return any time."
          />
        </div>

        <div className="mt-12 glass rounded-3xl p-6 sm:p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          <KeyDate icon="scroll" label="Submissions open" value="Now" />
          <KeyDate icon="medal" label="Submissions close" value="21 Jun 2026" />
          <KeyDate icon="trophy" label="Awards ceremony" value="27 Jun 2026" />
          <KeyDate icon="medal" label="Venue" value="Gyan Bhavan, AM Jain" />
        </div>
      </div>
    </section>
  );
}

function AboutCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-2xl p-7 relative overflow-hidden">
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d6ba73]/60 to-transparent" />
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#d6ba73]">{eyebrow}</div>
      <div className="mt-3 font-display text-2xl text-[rgba(244,234,213,0.95)] leading-tight">
        {title}
      </div>
      <p className="mt-3 text-sm text-[rgba(244,234,213,0.65)] leading-relaxed">{body}</p>
    </div>
  );
}

function KeyDate({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl grid place-items-center border border-[rgba(214,186,115,0.35)] bg-[rgba(214,186,115,0.06)] shrink-0">
        <AwardIcon name={icon} className="w-6 h-6" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.55)]">
          {label}
        </div>
        <div className="mt-0.5 font-display text-xl text-[#f4ead5]">{value}</div>
      </div>
    </div>
  );
}

function Categories() {
  return (
    <section id="categories" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="The Honours"
          title={
            <>
              25+ honours. <span className="gold-text">One stage.</span>
            </>
          }
          subtitle="From the Rotaract Club of the Year crown to individual recognition for the people who made it all possible — every award is a tribute to a different shade of service."
        />

        {CATEGORY_GROUPS.map((g) => {
          const items = CATEGORIES.filter((c) => c.group === g.key);
          return (
            <div key={g.key} className="mt-16">
              <div className="flex items-end justify-between mb-6 gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[#d6ba73]">
                    {g.label}
                  </div>
                  <div className="mt-1 font-display text-2xl sm:text-3xl text-[rgba(244,234,213,0.92)]">
                    {g.tagline}
                  </div>
                </div>
                <div className="hidden sm:block text-xs text-[rgba(244,234,213,0.5)]">
                  {items.length} {items.length === 1 ? "category" : "categories"}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {items.map((c) => (
                  <CategoryCard key={c.id} category={c} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: (typeof CATEGORIES)[number] }) {
  return (
    <Link
      href={`/nominate?category=${category.id}`}
      className="group relative block rounded-2xl glass p-6 hover:ring-gold transition-all overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(ellipse_at_top,rgba(214,186,115,0.12),transparent_60%)]" />
      <div className="relative flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl grid place-items-center bg-[rgba(214,186,115,0.08)] border border-[rgba(214,186,115,0.3)] group-hover:bg-[rgba(214,186,115,0.16)] transition-colors">
          <AwardIcon name={category.icon} className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.5)]">
            {category.group} Award
          </div>
          <div className="mt-1 font-display text-xl text-[rgba(244,234,213,0.95)] leading-tight">
            {category.title}
          </div>
          <p className="mt-2 text-sm text-[rgba(244,234,213,0.65)] leading-relaxed">
            {category.blurb}
          </p>
        </div>
      </div>
      <div className="relative mt-5 flex items-center justify-between text-xs">
        <span className="text-[rgba(244,234,213,0.45)]">Nominate now</span>
        <span className="inline-flex w-7 h-7 rounded-full border border-[rgba(214,186,115,0.4)] items-center justify-center group-hover:bg-[rgba(214,186,115,0.2)] transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke="#d6ba73"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function Process() {
  const steps = [
    {
      n: "01",
      t: "Identify your club",
      d: "Tell us who you are — club name, parent club, club number, and whether you're college-based or community-based.",
    },
    {
      n: "02",
      t: "Clear the gate",
      d: "Confirm RI and district dues are paid. Community clubs also confirm their bank account is active.",
    },
    {
      n: "03",
      t: "Tell the stories",
      d: "Nominate up to fourteen projects, share your club's year, and put forward your president, secretary, members and favourite officials.",
    },
    {
      n: "04",
      t: "Submit & celebrate",
      d: "Review, sign the declaration, and we'll take it from there. The jury convenes, the shortlist drops, and the stage awaits.",
    },
  ];
  return (
    <section id="process" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="The Path to the Stage"
          title={
            <>
              Four steps. <span className="gold-text">No fluff.</span>
            </>
          }
          subtitle="Built to honour the depth of your work without burying you in paperwork."
        />

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className="relative glass rounded-2xl p-7 overflow-hidden">
              <div className="absolute top-4 right-5 font-display text-5xl text-[rgba(214,186,115,0.18)]">
                {s.n}
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-full grid place-items-center border border-[rgba(214,186,115,0.4)] bg-[rgba(214,186,115,0.06)]">
                  <span className="font-display text-[#e8d49a]">{i + 1}</span>
                </div>
                <div className="mt-5 font-display text-xl text-[rgba(244,234,213,0.95)]">{s.t}</div>
                <p className="mt-2 text-sm text-[rgba(244,234,213,0.65)] leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Spotlight() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-8 sm:p-14 grain">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80%] h-72 star-burst blur-3xl opacity-60" />
          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <div className="chip mb-5">Powered by the district</div>
              <h3 className="font-display text-3xl sm:text-5xl leading-tight">
                <span className="text-[rgba(244,234,213,0.92)]">Every nomination is</span>{" "}
                <span className="gold-text">held in confidence.</span>
              </h3>
              <p className="mt-5 text-[15px] text-[rgba(244,234,213,0.7)] max-w-xl leading-relaxed">
                We don't publish names, clubs or numbers while the jury is at work. The
                counter you see opposite is the only thing we share publicly — a living
                tally of submissions, with no identifying details revealed until the
                ceremony itself.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/nominate" className="btn-gold px-6 py-3 rounded-full text-sm font-semibold">
                  Begin Your Nomination
                </Link>
              </div>
            </div>

            <SpotlightTallyCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function SpotlightTallyCard() {
  return (
    <div className="relative">
      <div className="aspect-square relative rounded-2xl overflow-hidden border border-[rgba(214,186,115,0.3)] bg-[linear-gradient(160deg,rgba(26,36,84,0.7),rgba(10,13,24,0.7))]">
        <div className="absolute inset-0 grid place-items-center text-center">
          <NominationCounter compact />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[rgba(5,6,10,0.9)] to-transparent">
          <div className="flex justify-between text-[11px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.7)]">
            <span>No names</span>
            <span>No clubs</span>
            <span>Just the count</span>
          </div>
        </div>
        <div className="absolute -top-3 -right-3 chip bg-[#0a0d18]">RY 2025-26</div>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center spotlight relative">
        <div className="chip mb-6 mx-auto">Don't let great work go unsung</div>
        <h2 className="font-display text-4xl sm:text-6xl leading-tight">
          <span className="text-[rgba(244,234,213,0.92)]">Your nomination is</span>{" "}
          <span className="gold-text">someone's standing ovation.</span>
        </h2>
        <p className="mt-6 text-[rgba(244,234,213,0.7)] text-[15px] max-w-xl mx-auto">
          Every section is auto-saved. Walk it once, return any time. You stay in control of the
          draft until the moment you sign and submit.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/nominate"
            className="btn-gold w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold"
          >
            Start a Nomination
          </Link>
          <Link
            href="#about"
            className="btn-ghost w-full sm:w-auto px-8 py-3.5 rounded-full text-sm"
          >
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#d6ba73]">{eyebrow}</div>
      <h2 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
        {title}
      </h2>
      <p className="mt-5 text-[15px] text-[rgba(244,234,213,0.65)] leading-relaxed">{subtitle}</p>
      <div className="gold-divider mt-8 max-w-xs mx-auto" />
    </div>
  );
}
