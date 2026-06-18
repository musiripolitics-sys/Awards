"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_SECTIONS, type ProjectKey } from "@/lib/nomination-flow";
import { supabase } from "@/lib/supabase";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type ProjectEntry = {
  nominate: boolean;
  name: string;
  coHostClubs?: string;
  startDate: string;
  endDate: string;
  beneficiaries: string;
  purpose: string;
  overview: string;
  highlights: string;
  picture1: string;
  picture2: string;
  picture3: string;
  links: string;
  media: string;
};

type OfficerData = {
  name: string;
  selfEval: string;
  keyContrib: string;
  consistency: string;
  events: string[];
  initiatives: string[];
  rotary: string[];
  otherEvents: string;
  drcMeetings: string;
  closedDoorMeetings: string;
  trfContribution: string;
  eventsHostedCoChair: string;
  photosLink: string;
  professionalImage?: string;
  challengeThisYear?: string;
  top3DO?: [string, string, string];
};

type Submission = {
  id: string;
  submittedAt: string;
  status: "pending" | "shortlisted" | "rejected" | "winner";
  clubName: string;
  parentClub: string;
  clubNumber: string;
  clubType: "college" | "community" | "";
  clubLogo?: string;
  riDuesPaid: string;
  riDuesProof?: string;
  districtDuesPaid: string;
  districtDuesProof?: string;
  bankAccountActive: string;
  bankProofName?: string;
  accountCreatedMailProof?: string;
  colourGalataHosted?: string;
  colourGalataContribution?: string;
  colourGalataReason?: string;
  twinClubAgreement?: string;
  twinClubAgreementProof?: string;
  projects: Record<ProjectKey, ProjectEntry>;
  clubSelfEval: string;
  clubEvents: string[];
  clubEventCounts?: Record<string, string>;
  clubInitiatives: string[];
  clubRotary: string[];
  clubOtherEvents?: string;
  clubPhotosLink: string;
  socialMediaDesc: string;
  socialMediaLinks: string;
  bestPracticeDesc: string;
  bestPracticePic1?: string;
  bestPracticePic2?: string;
  bestPracticePic3?: string;
  president: OfficerData;
  secretary: OfficerData;
  starNominees: { name: string; eval: string }[];
  declarationName: string;
  declarationRole: string;
  declarationDate: string;
  submittedBy?: string;
};

type EvalLevel =
  | "pending"
  | "reviewed"
  | "shortlisted"
  | "bronze"
  | "silver"
  | "gold"
  | "winner";

type AllEvals = Record<string, Record<string, EvalLevel>>; // submissionId → catId → level

/* ─── Category registry ───────────────────────────────────────────────────── */
const EVAL_CATEGORIES = [
  ...PROJECT_SECTIONS.map((p) => ({
    id: `project:${p.key}`,
    label: p.title,
    group: "Project Awards",
    sub: p.avenue,
  })),
  { id: "club-award",        label: "Best Rotaract Club",    group: "Club Awards",        sub: "Performance"  },
  { id: "social-media",      label: "Best Social Media",     group: "Club Awards",        sub: "Digital"      },
  { id: "best-practice",     label: "Best Practice Award",   group: "Club Awards",        sub: "Operations"   },
  { id: "president",         label: "President of the Year", group: "Officer Awards",     sub: "Leadership"   },
  { id: "secretary",         label: "Secretary of the Year", group: "Officer Awards",     sub: "Operations"   },
  { id: "star-of-rotaract",  label: "Star of Rotaract",      group: "Member Recognition", sub: "Individual"   },
];

const CATEGORY_GROUPS = [
  "Project Awards",
  "Club Awards",
  "Officer Awards",
  "Member Recognition",
];

/* ─── Level config ────────────────────────────────────────────────────────── */
type LevelCfg = { label: string; emoji: string; activeCls: string };

const LEVEL_MAP: Record<EvalLevel, LevelCfg> = {
  pending:     { label: "Pending",     emoji: "⏳", activeCls: "border-[rgba(244,234,213,0.25)] text-[rgba(244,234,213,0.55)] bg-transparent" },
  reviewed:    { label: "Reviewed",    emoji: "👀", activeCls: "border-blue-500/50 text-blue-300 bg-blue-500/10" },
  shortlisted: { label: "Shortlisted", emoji: "📋", activeCls: "border-[#d6ba73]/60 text-[#e8d49a] bg-[rgba(214,186,115,0.12)]" },
  bronze:      { label: "Bronze",      emoji: "🥉", activeCls: "border-[#c4845a]/60 text-[#d4926a] bg-[rgba(196,132,90,0.12)]" },
  silver:      { label: "Silver",      emoji: "🥈", activeCls: "border-[#a8b8c8]/60 text-[#c8d4e0] bg-[rgba(168,184,200,0.12)]" },
  gold:        { label: "Gold",        emoji: "🥇", activeCls: "border-[#d6ba73] text-[#f4ead5] bg-[rgba(214,186,115,0.2)]" },
  winner:      { label: "Winner",      emoji: "🏆", activeCls: "border-[#e8d49a] text-[#0a0d18] bg-[#d6ba73] font-bold" },
};

const LEVELS: EvalLevel[] = [
  "pending", "reviewed", "shortlisted", "bronze", "silver", "gold", "winner",
];

const LEVEL_ORDER: EvalLevel[] = [
  "winner", "gold", "silver", "bronze", "shortlisted", "reviewed", "pending",
];

const CAT_EVALS_KEY = "ignus-cat-evals-v1";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function hasNominated(item: Submission, catId: string): boolean {
  if (catId.startsWith("project:")) {
    const key = catId.replace("project:", "") as ProjectKey;
    return item.projects?.[key]?.nominate === true;
  }
  if (catId === "club-award")       return !!item.clubSelfEval?.trim();
  if (catId === "social-media")     return !!item.socialMediaDesc?.trim();
  if (catId === "best-practice")    return !!item.bestPracticeDesc?.trim();
  if (catId === "president")        return !!item.president?.name?.trim();
  if (catId === "secretary")        return !!item.secretary?.name?.trim();
  if (catId === "star-of-rotaract") return item.starNominees?.some((n) => n.name?.trim()) ?? false;
  return false;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function isAuthed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ignus-admin-auth") === "1";
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [authed, setAuthed]     = useState(false);
  const [user, setUser]         = useState("");
  const [pass, setPass]         = useState("");
  const [authErr, setAuthErr]   = useState("");

  const [items, setItems]       = useState<Submission[]>([]);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<"clubs" | "categories">("clubs");

  // By-club filters
  const [filter, setFilter]     = useState<"all" | Submission["status"]>("all");
  const [clubType, setClubType] = useState<"all" | "college" | "community">("all");
  const [query, setQuery]       = useState("");
  const [active, setActive]     = useState<Submission | null>(null);

  // By-category
  const [catGroup, setCatGroup] = useState("Project Awards");
  const [selCatId, setSelCatId] = useState(EVAL_CATEGORIES[0].id);
  const [allEvals, setAllEvals] = useState<AllEvals>({});

  /* init */
  useEffect(() => {
    setAuthed(isAuthed());
    try {
      const raw = localStorage.getItem(CAT_EVALS_KEY);
      if (raw) setAllEvals(JSON.parse(raw));
    } catch {}
  }, []);

  /* fetch */
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase
      .from("submissions")
      .select("*")
      .order("submittedAt", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as Submission[]);
        setLoading(false);
      });
  }, [authed]);

  /* login */
  function login(e: React.FormEvent) {
    e.preventDefault();
    if (user.trim() === "Vaticancity" && pass.trim() === "KNKbannana24") {
      localStorage.setItem("ignus-admin-auth", "1");
      setAuthed(true);
      setAuthErr("");
    } else {
      setAuthErr("Invalid credentials.");
    }
  }

  function logout() {
    localStorage.removeItem("ignus-admin-auth");
    setAuthed(false);
    setUser(""); setPass("");
  }

  /* status update */
  async function updateStatus(id: string, status: Submission["status"]) {
    try {
      const { error } = await supabase.from("submissions").update({ status }).eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.map((it) => it.id === id ? { ...it, status } : it));
      setActive((a) => a?.id === id ? { ...a, status } : a);
    } catch { alert("Failed to update status."); }
  }

  /* eval helpers */
  function setEval(subId: string, catId: string, level: EvalLevel) {
    setAllEvals((prev) => {
      const next = { ...prev, [subId]: { ...(prev[subId] || {}), [catId]: level } };
      try { localStorage.setItem(CAT_EVALS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function getEval(subId: string, catId: string): EvalLevel {
    return allEvals[subId]?.[catId] ?? "pending";
  }

  /* derived */
  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, shortlisted: 0, rejected: 0, winner: 0 };
    items.forEach((it) => { c[it.status] = (c[it.status] ?? 0) + 1; });
    return c;
  }, [items]);

  const filteredClubs = useMemo(() => items.filter((it) => {
    if (filter !== "all" && it.status !== filter) return false;
    if (clubType !== "all" && it.clubType !== clubType) return false;
    if (query) {
      const q = query.toLowerCase();
      if (![it.clubName, it.parentClub, it.clubNumber, it.id].join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, filter, clubType, query]);

  const groupedCats = useMemo(
    () => EVAL_CATEGORIES.filter((c) => c.group === catGroup),
    [catGroup]
  );

  const catNominees = useMemo(
    () => items.filter((it) => hasNominated(it, selCatId)),
    [items, selCatId]
  );

  /* eval summary per category */
  const catSummary = useMemo(() => {
    const out: Record<string, Partial<Record<EvalLevel, number>>> = {};
    EVAL_CATEGORIES.forEach((cat) => {
      const counts: Partial<Record<EvalLevel, number>> = {};
      items.forEach((it) => {
        if (hasNominated(it, cat.id)) {
          const lv = allEvals[it.id]?.[cat.id] ?? "pending";
          counts[lv] = (counts[lv] ?? 0) + 1;
        }
      });
      out[cat.id] = counts;
    });
    return out;
  }, [items, allEvals]);

  /* ── Login screen ───────────────────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden grain">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 star-burst blur-3xl opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-[rgba(214,186,115,0.15)] border border-[rgba(214,186,115,0.4)] grid place-items-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path d="M6 3h12l-1 6a5 5 0 0 1-10 0L6 3Z" stroke="#d6ba73" strokeWidth="1.4" />
                  <path d="M9 14v3H8v2h8v-2h-1v-3" stroke="#d6ba73" strokeWidth="1.4" />
                  <circle cx="12" cy="8" r="1.2" fill="#d6ba73" />
                </svg>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.28em] text-[rgba(244,234,213,0.5)]">IGNUS</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73]">Admin Console</div>
              </div>
            </div>
            <h2 className="font-display text-3xl text-[rgba(244,234,213,0.95)]">Awards Committee</h2>
            <p className="mt-1 text-sm text-[rgba(244,234,213,0.5)]">Authorised access only.</p>
            <form onSubmit={login} className="mt-7 grid gap-4">
              <div>
                <label className="input-label">Username</label>
                <input
                  className="input-field"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  autoComplete="username"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              {authErr && <div className="text-xs text-[#f6b8a3]">{authErr}</div>}
              <button type="submit" className="btn-gold mt-2 px-6 py-3 rounded-full text-sm font-semibold">
                Enter Console →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Dashboard ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="glass-strong rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5 flex-wrap">
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-[rgba(244,234,213,0.45)]">IGNUS · District 3233</div>
            <div className="font-display text-xl gold-text">Awards Console</div>
          </div>
          <div className="h-8 w-px bg-[rgba(214,186,115,0.2)] hidden sm:block" />
          <div className="flex gap-4 flex-wrap">
            {[
              { l: "Total",       v: counts.all,         c: "text-[rgba(244,234,213,0.85)]" },
              { l: "Pending",     v: counts.pending,     c: "text-[rgba(244,234,213,0.6)]"  },
              { l: "Shortlisted", v: counts.shortlisted, c: "text-[#d6ba73]"                },
              { l: "Winners",     v: counts.winner,      c: "text-[#f4ead5]"                },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className={`font-display text-2xl ${s.c}`}>{s.v}</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.4)]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-[rgba(214,186,115,0.3)] overflow-hidden">
            {(["clubs", "categories"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                  mode === m
                    ? "bg-[rgba(214,186,115,0.18)] text-[#f4ead5]"
                    : "text-[rgba(244,234,213,0.5)] hover:text-[#f4ead5]"
                }`}
              >
                {m === "clubs" ? "By Club" : "By Category"}
              </button>
            ))}
          </div>
          <button
            onClick={logout}
            className="btn-ghost px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em]"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ═══════════════════════ BY CLUB ═══════════════════════════════════ */}
      {mode === "clubs" && (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5">

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.45)] mb-3">Status</div>
              <div className="space-y-1">
                {(
                  [
                    ["all",         "All Submissions", counts.all        ],
                    ["pending",     "Pending",         counts.pending    ],
                    ["shortlisted", "Shortlisted",     counts.shortlisted],
                    ["rejected",    "Not Advanced",    counts.rejected   ],
                    ["winner",      "Winners",         counts.winner     ],
                  ] as const
                ).map(([k, label, n]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${
                      filter === k
                        ? "bg-[rgba(214,186,115,0.14)] text-[#f4ead5] border border-[rgba(214,186,115,0.4)]"
                        : "text-[rgba(244,234,213,0.65)] border border-transparent hover:bg-[rgba(214,186,115,0.07)]"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[11px] text-[rgba(244,234,213,0.45)]">{n}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.45)] mb-3">Club Type</div>
              <div className="space-y-1">
                {(["all", "college", "community"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setClubType(t)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                      clubType === t
                        ? "bg-[rgba(214,186,115,0.14)] text-[#f4ead5]"
                        : "text-[rgba(244,234,213,0.65)] hover:bg-[rgba(214,186,115,0.07)]"
                    }`}
                  >
                    {t === "all" ? "All clubs" : t === "college" ? "College-based" : "Community-based"}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* List */}
          <section className="space-y-3">
            <div className="glass rounded-2xl p-3 flex items-center gap-3">
              <input
                className="input-field flex-1"
                placeholder="Search club name, parent, ref…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="text-xs text-[rgba(244,234,213,0.45)] px-2 shrink-0">
                {filteredClubs.length} / {items.length}
              </span>
            </div>

            {loading && (
              <div className="glass rounded-2xl p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-[#d6ba73] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && filteredClubs.length === 0 && (
              <div className="glass rounded-2xl p-12 text-center text-[rgba(244,234,213,0.45)] text-sm">
                {items.length === 0 ? "No nominations received yet." : "No results match your filters."}
              </div>
            )}

            {filteredClubs.map((it) => {
              const projCount = Object.values(it.projects || {}).filter((p) => p?.nominate).length;
              // gather eval level pills for this submission
              const levelPills: { lv: EvalLevel; n: number }[] = [];
              (["winner", "gold", "silver", "bronze", "shortlisted", "reviewed"] as EvalLevel[]).forEach((lv) => {
                const n = EVAL_CATEGORIES.filter(
                  (cat) => hasNominated(it, cat.id) && (allEvals[it.id]?.[cat.id] ?? "pending") === lv
                ).length;
                if (n) levelPills.push({ lv, n });
              });

              return (
                <button
                  key={it.id}
                  onClick={() => setActive(it)}
                  className="w-full text-left glass rounded-2xl p-5 hover:ring-gold transition-all"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {it.clubLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.clubLogo}
                          alt="logo"
                          className="w-11 h-11 rounded-xl object-contain border border-[rgba(214,186,115,0.3)] bg-[rgba(214,186,115,0.05)] p-0.5 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.45)]">
                          <span>{it.id}</span>
                          <span className="text-[#d6ba73]">·</span>
                          <span className="text-[#d6ba73]">
                            {it.clubType === "community" ? "Community" : "College"}
                          </span>
                        </div>
                        <div className="mt-1 font-display text-xl text-[rgba(244,234,213,0.95)] truncate">
                          {it.clubName || "Unnamed club"}
                        </div>
                        <div className="text-sm text-[rgba(244,234,213,0.55)] mt-0.5 truncate">
                          {it.parentClub} · #{it.clubNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={it.status} />
                      {levelPills.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {levelPills.map(({ lv, n }) => {
                            const cfg = LEVEL_MAP[lv];
                            return (
                              <span
                                key={lv}
                                className={`text-[9px] px-2 py-0.5 rounded-full border ${cfg.activeCls}`}
                              >
                                {cfg.emoji} {n}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[rgba(214,186,115,0.1)] flex items-center justify-between text-xs text-[rgba(244,234,213,0.4)]">
                    <span>
                      {projCount} project{projCount !== 1 ? "s" : ""} ·{" "}
                      {it.starNominees?.filter((n) => n.name).length || 0} star nominees ·{" "}
                      Signed: {it.declarationName || "—"}
                    </span>
                    <span>{formatDate(it.submittedAt)}</span>
                  </div>
                </button>
              );
            })}
          </section>
        </div>
      )}

      {/* ════════════════════ BY CATEGORY ══════════════════════════════════ */}
      {mode === "categories" && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-5">

          {/* Category sidebar */}
          <aside className="space-y-3">
            {/* Group tabs */}
            <div className="glass rounded-2xl p-2 space-y-0.5">
              {CATEGORY_GROUPS.map((g) => {
                const gCats = EVAL_CATEGORIES.filter((c) => c.group === g);
                const nominated = gCats.reduce((sum, cat) =>
                  sum + items.filter((it) => hasNominated(it, cat.id)).length, 0);
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setCatGroup(g);
                      const first = EVAL_CATEGORIES.find((c) => c.group === g);
                      if (first) setSelCatId(first.id);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition ${
                      catGroup === g
                        ? "bg-[rgba(214,186,115,0.15)] text-[#f4ead5]"
                        : "text-[rgba(244,234,213,0.65)] hover:bg-[rgba(214,186,115,0.07)]"
                    }`}
                  >
                    <div className="text-sm font-medium">{g}</div>
                    <div className="text-[10px] text-[rgba(244,234,213,0.4)] mt-0.5">
                      {gCats.length} categories · {nominated} nominations
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Category list */}
            <div className="glass rounded-2xl p-2 space-y-0.5">
              <div className="text-[9px] uppercase tracking-[0.28em] text-[rgba(244,234,213,0.35)] px-3 py-2">
                {catGroup}
              </div>
              {groupedCats.map((cat) => {
                const nominees = items.filter((it) => hasNominated(it, cat.id));
                const topLevel = nominees.reduce<EvalLevel | null>((best, it) => {
                  const lv = allEvals[it.id]?.[cat.id] ?? "pending";
                  if (!best || LEVEL_ORDER.indexOf(lv) < LEVEL_ORDER.indexOf(best)) return lv;
                  return best;
                }, null);
                const summary = catSummary[cat.id] ?? {};
                const evaluated = nominees.length - (summary.pending ?? nominees.length);

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelCatId(cat.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition ${
                      selCatId === cat.id
                        ? "bg-[rgba(214,186,115,0.15)] text-[#f4ead5] border border-[rgba(214,186,115,0.35)]"
                        : "text-[rgba(244,234,213,0.65)] hover:bg-[rgba(214,186,115,0.07)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">{cat.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {nominees.length > 0 && (
                          <span className="text-[10px] text-[rgba(244,234,213,0.4)]">{nominees.length}</span>
                        )}
                        {topLevel && topLevel !== "pending" && (
                          <span>{LEVEL_MAP[topLevel].emoji}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[rgba(244,234,213,0.35)]">{cat.sub}</span>
                      {nominees.length > 0 && (
                        <span className="text-[9px] text-[rgba(244,234,213,0.3)]">
                          {evaluated}/{nominees.length} evaluated
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Nominees panel */}
          <section>
            {(() => {
              const cat = EVAL_CATEGORIES.find((c) => c.id === selCatId);
              if (!cat) return null;
              const summary = catSummary[selCatId] ?? {};

              return (
                <div className="space-y-4">
                  {/* Category header */}
                  <div className="glass-strong rounded-2xl p-5">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#d6ba73]">
                      {cat.group} · {cat.sub}
                    </div>
                    <h2 className="font-display text-3xl text-[rgba(244,234,213,0.95)] mt-1">
                      {cat.label}
                    </h2>
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-[rgba(244,234,213,0.55)]">
                        {catNominees.length} club{catNominees.length !== 1 ? "s" : ""} nominated
                      </span>
                      {(["winner", "gold", "silver", "bronze", "shortlisted", "reviewed"] as EvalLevel[]).map((lv) => {
                        const n = summary[lv] ?? 0;
                        if (!n) return null;
                        const cfg = LEVEL_MAP[lv];
                        return (
                          <span
                            key={lv}
                            className={`text-[10px] px-2.5 py-1 rounded-full border ${cfg.activeCls}`}
                          >
                            {cfg.emoji} {cfg.label} · {n}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {catNominees.length === 0 && (
                    <div className="glass rounded-2xl p-12 text-center text-[rgba(244,234,213,0.45)] text-sm">
                      No clubs have nominated in this category.
                    </div>
                  )}

                  {catNominees.map((item) => {
                    const currentLevel = getEval(item.id, selCatId);
                    const cfg = LEVEL_MAP[currentLevel];

                    return (
                      <div key={item.id} className="glass rounded-2xl overflow-hidden">
                        {/* Club header */}
                        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-[rgba(214,186,115,0.12)]">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.clubLogo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.clubLogo}
                                alt="logo"
                                className="w-9 h-9 rounded-lg object-contain border border-[rgba(214,186,115,0.3)] bg-[rgba(214,186,115,0.05)] p-0.5 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-display text-lg text-[rgba(244,234,213,0.95)] truncate">
                                {item.clubName}
                              </div>
                              <div className="text-xs text-[rgba(244,234,213,0.45)]">
                                {item.parentClub} · #{item.clubNumber} ·{" "}
                                {item.clubType === "community" ? "Community" : "College"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full border ${cfg.activeCls}`}
                          >
                            {cfg.emoji} {cfg.label}
                          </span>
                        </div>

                        {/* Nomination content */}
                        <div className="px-5 py-4 space-y-3">
                          <NominationDetail item={item} catId={selCatId} />
                        </div>

                        {/* Level selector */}
                        <div className="px-5 pb-5">
                          <div className="text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.4)] mb-2">
                            Evaluation Level
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {LEVELS.map((lv) => {
                              const lvCfg = LEVEL_MAP[lv];
                              const isActive = currentLevel === lv;
                              return (
                                <button
                                  key={lv}
                                  onClick={() => setEval(item.id, selCatId, lv)}
                                  className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                                    isActive
                                      ? lvCfg.activeCls
                                      : "border-[rgba(214,186,115,0.2)] text-[rgba(244,234,213,0.5)] hover:border-[rgba(214,186,115,0.45)] hover:text-[rgba(244,234,213,0.85)]"
                                  }`}
                                >
                                  {lvCfg.emoji} {lvCfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* Drawer */}
      {active && (
        <SubmissionDrawer
          item={active}
          onClose={() => setActive(null)}
          onStatus={(s) => updateStatus(active.id, s)}
          allEvals={allEvals}
        />
      )}
    </div>
  );
}

/* ─── Nomination detail per category ─────────────────────────────────────── */
function NominationDetail({ item, catId }: { item: Submission; catId: string }) {
  if (catId.startsWith("project:")) {
    const key = catId.replace("project:", "") as ProjectKey;
    const proj = item.projects?.[key];
    if (!proj) return null;
    return (
      <div className="space-y-3">
        <div>
          <div className="font-semibold text-[#f4ead5] text-base">{proj.name}</div>
          <div className="text-xs text-[rgba(244,234,213,0.45)] mt-0.5">
            {proj.startDate} → {proj.endDate} · {proj.beneficiaries} beneficiaries
          </div>
        </div>
        {proj.purpose && (
          <div className="text-sm text-[rgba(244,234,213,0.7)] italic">{proj.purpose}</div>
        )}
        {proj.overview && (
          <div className="text-sm text-[rgba(244,234,213,0.85)] leading-relaxed whitespace-pre-wrap">
            {proj.overview}
          </div>
        )}
        {proj.highlights && (
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.4)] mb-1">Highlights</div>
            <div className="text-sm text-[rgba(244,234,213,0.8)] whitespace-pre-wrap">{proj.highlights}</div>
          </div>
        )}
        {(proj.picture1 || proj.picture2 || proj.picture3) && (
          <div className="flex gap-2 flex-wrap">
            {[proj.picture1, proj.picture2, proj.picture3].filter(Boolean).map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`pic ${i + 1}`}
                  className="w-24 h-24 object-cover rounded-xl border border-[rgba(214,186,115,0.25)] hover:opacity-80 transition"
                />
              </a>
            ))}
          </div>
        )}
        {proj.coHostClubs && (
          <div className="text-xs text-[rgba(214,186,115,0.7)]">Co-hosts: {proj.coHostClubs}</div>
        )}
        {proj.links && (
          <a href={proj.links} target="_blank" rel="noreferrer" className="text-xs text-[#d6ba73] hover:underline block">
            Related links ↗
          </a>
        )}
      </div>
    );
  }

  if (catId === "club-award") {
    return (
      <div className="text-sm text-[rgba(244,234,213,0.85)] whitespace-pre-wrap leading-relaxed line-clamp-6">
        {item.clubSelfEval}
      </div>
    );
  }

  if (catId === "social-media") {
    return (
      <div className="space-y-2">
        <div className="text-sm text-[rgba(244,234,213,0.85)] line-clamp-4">{item.socialMediaDesc}</div>
        {item.socialMediaLinks && (
          <div className="text-xs text-[#d6ba73] break-all">{item.socialMediaLinks}</div>
        )}
      </div>
    );
  }

  if (catId === "best-practice") {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[rgba(244,234,213,0.85)] whitespace-pre-wrap leading-relaxed line-clamp-5">
          {item.bestPracticeDesc}
        </div>
        {(item.bestPracticePic1 || item.bestPracticePic2 || item.bestPracticePic3) && (
          <div className="flex gap-2 flex-wrap">
            {[item.bestPracticePic1, item.bestPracticePic2, item.bestPracticePic3].filter(Boolean).map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`pic ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-[rgba(214,186,115,0.25)] hover:opacity-80 transition" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (catId === "president" || catId === "secretary") {
    const officer = catId === "president" ? item.president : item.secretary;
    if (!officer) return null;
    return (
      <div className="space-y-2">
        <div className="font-semibold text-[#f4ead5]">{officer.name}</div>
        <div className="text-sm text-[rgba(244,234,213,0.8)] line-clamp-4 whitespace-pre-wrap">{officer.selfEval}</div>
        <div className="text-xs text-[rgba(244,234,213,0.45)]">
          DRC meetings: {officer.drcMeetings} · Closed-door: {officer.closedDoorMeetings} · TRF: {officer.trfContribution}
        </div>
        {officer.photosLink && (
          <a href={officer.photosLink} target="_blank" rel="noreferrer" className="text-xs text-[#d6ba73] hover:underline">
            Photo album ↗
          </a>
        )}
      </div>
    );
  }

  if (catId === "star-of-rotaract") {
    return (
      <div className="space-y-3">
        {item.starNominees?.filter((n) => n.name).map((n, i) => (
          <div key={i} className="glass rounded-xl p-3">
            <div className="font-semibold text-[#f4ead5] text-sm">Nominee {i + 1}: {n.name}</div>
            <div className="text-xs text-[rgba(244,234,213,0.7)] mt-1 line-clamp-3">{n.eval}</div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/* ─── Status badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: Submission["status"] }) {
  const map: Record<Submission["status"], { l: string; cls: string }> = {
    pending:     { l: "Pending",      cls: "border-[rgba(244,234,213,0.3)] text-[rgba(244,234,213,0.75)]" },
    shortlisted: { l: "Shortlisted",  cls: "border-[#d6ba73] text-[#e8d49a] bg-[rgba(214,186,115,0.1)]" },
    winner:      { l: "Winner ★",     cls: "border-[#e8d49a] text-[#0a0d18] bg-[#d6ba73] font-bold" },
    rejected:    { l: "Not Advanced", cls: "border-[rgba(255,150,140,0.4)] text-[#f6b8a3]" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] border px-3 py-1 rounded-full ${m.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {m.l}
    </span>
  );
}

/* ─── Submission drawer (By-Club detail view) ─────────────────────────────── */
function SubmissionDrawer({
  item,
  onClose,
  onStatus,
  allEvals,
}: {
  item: Submission;
  onClose: () => void;
  onStatus: (s: Submission["status"]) => void;
  allEvals: AllEvals;
}) {
  const projects = Object.entries(item.projects || {}).filter(([, p]) => p?.nominate);

  // Collect category level summary for this submission
  const evalSummary = EVAL_CATEGORIES.filter((cat) => hasNominated(item, cat.id)).map((cat) => ({
    cat,
    level: (allEvals[item.id]?.[cat.id] ?? "pending") as EvalLevel,
  }));

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside className="relative w-full max-w-2xl h-full overflow-y-auto bg-[#06080f] border-l border-[rgba(214,186,115,0.2)]">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[rgba(6,8,15,0.96)] backdrop-blur-md border-b border-[rgba(214,186,115,0.18)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
              {item.id} · {item.clubType === "community" ? "Community" : "College"}
            </div>
            <div className="font-display text-xl text-[#f4ead5] mt-0.5">{item.clubName}</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[rgba(214,186,115,0.3)] grid place-items-center hover:bg-[rgba(214,186,115,0.08)] text-[rgba(244,234,213,0.7)]"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Club identity */}
          <DrawerSection title="Club Identity">
            {item.clubLogo && (
              <div className="flex items-center gap-3 pb-3 mb-1 border-b border-[rgba(214,186,115,0.1)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.clubLogo}
                  alt="logo"
                  className="w-14 h-14 rounded-xl object-contain border border-[rgba(214,186,115,0.3)] bg-[rgba(214,186,115,0.05)] p-1"
                />
                <span className="text-xs text-[rgba(244,234,213,0.45)]">Club logo</span>
              </div>
            )}
            <Info label="Club" value={`${item.clubName} (Rotary Club of ${item.parentClub})`} />
            <Info label="Club number" value={item.clubNumber} />
            <Info label="Type" value={item.clubType === "community" ? "Community-based" : "College-based"} />
            <Info label="Submitted" value={formatDate(item.submittedAt)} />
            {item.submittedBy && <Info label="Authenticated as" value={item.submittedBy} />}
          </DrawerSection>

          {/* Category evaluation summary */}
          {evalSummary.length > 0 && (
            <DrawerSection title="Category Evaluations">
              <div className="grid gap-1.5">
                {evalSummary.map(({ cat, level }) => {
                  const cfg = LEVEL_MAP[level];
                  return (
                    <div key={cat.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-[rgba(244,234,213,0.65)] truncate pr-3">{cat.label}</span>
                      <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full border ${cfg.activeCls}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </DrawerSection>
          )}

          {/* Eligibility */}
          <DrawerSection title="Eligibility & Documents">
            <EligibilityRow label="RI Dues" paid={item.riDuesPaid === "yes"} proofUrl={item.riDuesProof} />
            <EligibilityRow label="District Dues" paid={item.districtDuesPaid === "yes"} proofUrl={item.districtDuesProof} />
            {item.clubType === "community" && (
              <>
                <EligibilityRow label="Bank account" paid={item.bankAccountActive === "yes"} proofUrl={item.bankProofName} />
                {item.accountCreatedMailProof && (
                  <div className="flex items-center justify-between text-sm py-1">
                    <span className="text-[rgba(244,234,213,0.6)]">Account created mail</span>
                    <a href={item.accountCreatedMailProof} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.18em] text-[#d6ba73] hover:underline">View PDF ↗</a>
                  </div>
                )}
                {item.colourGalataHosted && (
                  <div className="pt-2 border-t border-[rgba(214,186,115,0.1)] mt-1">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#d6ba73] mb-2">Colour Galata</div>
                    <Info label="Participated" value={item.colourGalataHosted === "yes" ? "✓ Yes" : "✗ No"} />
                    {item.colourGalataContribution && <Block label="Contribution" value={item.colourGalataContribution} />}
                    {item.colourGalataReason && <Block label="Reason" value={item.colourGalataReason} />}
                  </div>
                )}
              </>
            )}
          </DrawerSection>

          {/* Projects */}
          <DrawerSection title={`Project Nominations · ${projects.length}`}>
            {projects.length === 0 && (
              <div className="text-sm text-[rgba(244,234,213,0.45)]">No projects nominated.</div>
            )}
            {projects.map(([key, p]) => {
              const meta = PROJECT_SECTIONS.find((s) => s.key === key as ProjectKey);
              const level = (allEvals[item.id]?.[`project:${key}`] ?? "pending") as EvalLevel;
              const cfg = LEVEL_MAP[level];
              return (
                <div key={key} className="glass rounded-xl p-4 mb-3 last:mb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#d6ba73]">{meta?.avenue} · {meta?.title}</div>
                      <div className="font-display text-lg text-[#f4ead5] mt-0.5">{p.name}</div>
                    </div>
                    <span className={`shrink-0 text-[9px] px-2 py-1 rounded-full border ${cfg.activeCls}`}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-[rgba(244,234,213,0.5)]">
                    {p.startDate} → {p.endDate} · {p.beneficiaries} beneficiaries
                  </div>
                  <div className="text-sm text-[rgba(244,234,213,0.82)] whitespace-pre-wrap">{p.overview}</div>
                  {(p.picture1 || p.picture2 || p.picture3) && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {[p.picture1, p.picture2, p.picture3].filter(Boolean).map((src, i) => (
                        <a key={i} href={src} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`pic ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-[rgba(214,186,115,0.2)] hover:opacity-80 transition" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </DrawerSection>

          {/* Club performance */}
          <DrawerSection title="Club Performance">
            <Block label="Self-evaluation" value={item.clubSelfEval} />
            {item.clubEvents?.length > 0 && (
              <div>
                <div className="text-xs text-[rgba(244,234,213,0.45)] mb-2">District events</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.clubEvents.map((evt) => (
                    <span key={evt} className="chip text-[11px]">
                      {evt}{item.clubEventCounts?.[evt] ? ` · ${item.clubEventCounts[evt]}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Pills label="District initiatives" values={item.clubInitiatives} />
            <Pills label="Rotary initiatives" values={item.clubRotary} />
            <EligibilityRow
              label="Twin/Sister Club"
              paid={item.twinClubAgreement === "yes"}
              proofUrl={item.twinClubAgreementProof}
            />
            {item.clubPhotosLink && <Info label="Photo album" value={item.clubPhotosLink} />}
          </DrawerSection>

          {/* Social media & best practice */}
          <DrawerSection title="Social Media & Best Practice">
            <Block label="Social media" value={item.socialMediaDesc} />
            {item.socialMediaLinks && <Info label="Links" value={item.socialMediaLinks} />}
            <Block label="Best practice" value={item.bestPracticeDesc} />
          </DrawerSection>

          {/* Officers */}
          <DrawerSection title="President">
            <OfficerCard officer={item.president} />
          </DrawerSection>
          <DrawerSection title="Secretary">
            <OfficerCard officer={item.secretary} />
          </DrawerSection>

          {/* Star of Rotaract */}
          <DrawerSection title="Star of Rotaract">
            {item.starNominees?.map((n, i) => (
              <div key={i} className="glass rounded-xl p-4 mb-2 last:mb-0">
                <div className="font-display text-lg text-[#f4ead5]">{n.name || "—"}</div>
                <div className="text-sm text-[rgba(244,234,213,0.75)] mt-1">{n.eval}</div>
              </div>
            ))}
          </DrawerSection>

          {/* Declaration */}
          <DrawerSection title="Declaration">
            <Info label="Signed by" value={item.declarationName} />
            <Info label="Role" value={item.declarationRole} />
            <Info label="Date" value={item.declarationDate} />
          </DrawerSection>
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-[rgba(6,8,15,0.97)] backdrop-blur-md border-t border-[rgba(214,186,115,0.18)] px-6 py-4 flex flex-wrap gap-2 justify-end">
          <button onClick={() => onStatus("rejected")}    className="btn-ghost px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em]">Not Advanced</button>
          <button onClick={() => onStatus("pending")}     className="btn-ghost px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em]">Reset Pending</button>
          <button onClick={() => onStatus("shortlisted")} className="btn-gold px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em] font-semibold">Shortlist</button>
          <button onClick={() => onStatus("winner")}      className="btn-gold px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em] font-semibold">Declare Winner ★</button>
        </div>
      </aside>
    </div>
  );
}

/* ─── Small shared components ─────────────────────────────────────────────── */
function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#d6ba73] mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 py-1 text-sm">
      <div className="text-[rgba(244,234,213,0.5)]">{label}</div>
      <div className="text-[#f4ead5] break-words">{value || "—"}</div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.45)] mb-1.5">{label}</div>
      <div className="text-sm text-[rgba(244,234,213,0.85)] whitespace-pre-wrap leading-relaxed">{value}</div>
    </div>
  );
}

function Pills({ label, values }: { label: string; values?: string[] }) {
  if (!values?.length) return null;
  return (
    <div className="py-1">
      <div className="text-xs text-[rgba(244,234,213,0.5)] mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="text-[11px] px-2 py-1 rounded-full border border-[rgba(214,186,115,0.3)] text-[#e8d49a]">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function EligibilityRow({ label, paid, proofUrl }: { label: string; paid: boolean; proofUrl?: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-[rgba(244,234,213,0.6)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className={paid ? "text-emerald-400" : "text-red-400"}>
          {paid ? "✓ Yes" : "✗ No"}
        </span>
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noreferrer"
            className="text-[10px] uppercase tracking-[0.18em] text-[#d6ba73] hover:underline">
            View ↗
          </a>
        )}
      </div>
    </div>
  );
}

function OfficerCard({ officer }: { officer: OfficerData }) {
  if (!officer?.name) return <div className="text-sm text-[rgba(244,234,213,0.45)]">Not filled.</div>;
  return (
    <div className="space-y-2">
      {officer.professionalImage && (
        <div className="flex items-center gap-3 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={officer.professionalImage} alt="photo"
            className="w-14 h-14 rounded-full object-cover border border-[rgba(214,186,115,0.4)]" />
        </div>
      )}
      <Info label="Name" value={officer.name} />
      <Block label="Self-evaluation" value={officer.selfEval} />
      <Block label="Key contribution" value={officer.keyContrib} />
      <Block label="Consistency / Leadership" value={officer.consistency} />
      {officer.challengeThisYear && <Block label="Biggest challenge" value={officer.challengeThisYear} />}
      <Pills label="District events" values={officer.events} />
      <Pills label="District initiatives" values={officer.initiatives} />
      <Pills label="Rotary initiatives" values={officer.rotary} />
      <Info label="DRC meetings" value={officer.drcMeetings} />
      <Info label="Closed-door meetings" value={officer.closedDoorMeetings} />
      <Info label="TRF contribution" value={officer.trfContribution} />
      {officer.photosLink && <Info label="Photo album" value={officer.photosLink} />}
      {officer.top3DO?.some((d) => d?.trim()) && (
        <div>
          <div className="text-xs text-[rgba(244,234,213,0.45)] mb-1">Top 3 DO Nominations</div>
          <ol className="list-decimal list-inside space-y-0.5">
            {officer.top3DO.filter((d) => d?.trim()).map((d, i) => (
              <li key={i} className="text-sm text-[rgba(244,234,213,0.85)]">{d}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
