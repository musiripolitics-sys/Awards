"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_SECTIONS, type ProjectKey } from "@/lib/nomination-flow";
import { supabase } from "@/lib/supabase";

type ProjectEntry = {
  nominate: boolean;
  name: string;
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
};

type Submission = {
  id: string;
  submittedAt: string;
  status: "pending" | "shortlisted" | "rejected" | "winner";
  clubName: string;
  parentClub: string;
  clubNumber: string;
  clubType: "college" | "community" | "";
  riDuesPaid: string;
  districtDuesPaid: string;
  bankAccountActive: string;
  bankProofName?: string;
  projects: Record<ProjectKey, ProjectEntry>;
  clubSelfEval: string;
  clubEvents: string[];
  clubInitiatives: string[];
  clubRotary: string[];
  clubPhotosLink: string;
  socialMediaDesc: string;
  socialMediaLinks: string;
  happyMomentDesc: string;
  bestPracticeDesc: string;
  president: OfficerData;
  secretary: OfficerData;
  starNominees: { name: string; eval: string }[];
  favoriteDONominees: { name: string; eval: string }[];
  declarationName: string;
  declarationRole: string;
  declarationDate: string;
  submittedBy?: string;
};

const STORAGE = "rotaract-submissions";

function isLocalAuthed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("rotaract-admin-authed") === "1";
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [authError, setAuthError] = useState("");

  const [items, setItems] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "shortlisted" | "rejected" | "winner">("all");
  const [type, setType] = useState<"all" | "college" | "community">("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Submission | null>(null);

  useEffect(() => {
    setAuthed(isLocalAuthed());
  }, []);

  useEffect(() => {
    if (!authed) return;

    async function fetchSubmissions() {
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .order("submittedAt", { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error("Error fetching submissions from Supabase:", err);
      }
    }

    fetchSubmissions();
  }, [authed]);

  async function updateStatus(id: string, status: Submission["status"]) {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
      setActive((a) => (a && a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error("Error updating submission status in Supabase:", err);
      alert("Failed to update status. Please try again.");
    }
  }

  function login(e: React.FormEvent) {
    e.preventDefault();
    if ((user === "admin" && pass === "rotaract") || user === "demo") {
      localStorage.setItem("rotaract-admin-authed", "1");
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Try admin / rotaract for the demo.");
    }
  }

  function logout() {
    localStorage.removeItem("rotaract-admin-authed");
    setAuthed(false);
  }

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter !== "all" && it.status !== filter) return false;
      if (type !== "all" && it.clubType !== type) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = [it.clubName, it.parentClub, it.clubNumber, it.id].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, type, query]);

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, shortlisted: 0, rejected: 0, winner: 0 };
    items.forEach((it) => {
      c[it.status] += 1;
    });
    return c;
  }, [items]);

  if (!authed) {
    return (
      <div className="max-w-md mx-auto glass-strong rounded-3xl p-8 sm:p-10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73]">Secure area</div>
        <h2 className="mt-2 font-display text-3xl">Awards Committee login</h2>
        <p className="mt-1 text-sm text-[rgba(244,234,213,0.6)]">
          Demo credentials: <span className="text-[#e8d49a]">admin / rotaract</span>
        </p>
        <form onSubmit={login} className="mt-6 grid gap-4">
          <div>
            <label className="input-label">Username</label>
            <input className="input-field" value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {authError && <div className="text-xs text-[#f6b8a3]">{authError}</div>}
          <button className="btn-gold mt-2 px-6 py-3 rounded-full text-sm font-semibold">Enter the Console</button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <aside className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.55)] mb-3">
            Status
          </div>
          <div className="space-y-1.5">
            {(
              [
                ["all", "All", counts.all],
                ["pending", "Pending", counts.pending],
                ["shortlisted", "Shortlisted", counts.shortlisted],
                ["rejected", "Rejected", counts.rejected],
                ["winner", "Winners", counts.winner],
              ] as const
            ).map(([k, label, n]) => (
              <button
                key={k}
                onClick={() => setFilter(k as typeof filter)}
                className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition ${
                  filter === k
                    ? "bg-[rgba(214,186,115,0.14)] text-[#f4ead5] border border-[rgba(214,186,115,0.4)]"
                    : "text-[rgba(244,234,213,0.7)] border border-transparent hover:bg-[rgba(214,186,115,0.06)]"
                }`}
              >
                <span>{label}</span>
                <span className="text-[11px] text-[rgba(244,234,213,0.6)]">{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.55)] mb-3">
            Club type
          </div>
          <div className="space-y-1.5">
            {(["all", "college", "community"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition ${
                  type === t
                    ? "bg-[rgba(214,186,115,0.14)] text-[#f4ead5]"
                    : "text-[rgba(244,234,213,0.7)] hover:bg-[rgba(214,186,115,0.06)]"
                }`}
              >
                {t === "all" ? "All clubs" : t === "college" ? "College-based" : "Community-based"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full btn-ghost px-4 py-2.5 rounded-full text-xs uppercase tracking-[0.2em]"
        >
          Sign out
        </button>
      </aside>

      <section className="space-y-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <input
            className="input-field flex-1 min-w-[220px]"
            placeholder="Search club, parent or reference…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs text-[rgba(244,234,213,0.55)] px-2">
            {filtered.length} of {items.length}
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-[rgba(244,234,213,0.55)]">
              {items.length === 0
                ? "No nominations yet — once clubs submit, they'll appear here."
                : "No nominations match the current filters."}
            </div>
          )}
          {filtered.map((it) => {
            const projectCount = Object.values(it.projects || {}).filter((p) => p?.nominate).length;
            return (
              <button
                key={it.id}
                onClick={() => setActive(it)}
                className="text-left glass rounded-2xl p-5 hover:ring-gold transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.55)]">
                      <span>{it.id}</span>
                      <span className="text-[#d6ba73]">·</span>
                      <span className="text-[#d6ba73]">
                        {it.clubType === "community" ? "Community-based" : "College-based"}
                      </span>
                    </div>
                    <div className="mt-1.5 font-display text-xl sm:text-2xl text-[rgba(244,234,213,0.95)]">
                      {it.clubName || "Unnamed club"}
                    </div>
                    <div className="text-sm text-[rgba(244,234,213,0.65)] mt-1">
                      {it.parentClub} · Club #{it.clubNumber}
                    </div>
                    <div className="text-xs text-[rgba(244,234,213,0.5)] mt-2">
                      {projectCount} project nomination{projectCount === 1 ? "" : "s"} ·{" "}
                      {it.starNominees?.filter((n) => n.name).length || 0} Star nominees ·{" "}
                      {it.favoriteDONominees?.filter((n) => n.name).length || 0} Favorite DOs
                    </div>
                  </div>
                  <StatusBadge status={it.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[rgba(244,234,213,0.5)]">
                  <span>Signed by {it.declarationName || "—"}</span>
                  <span>{formatDate(it.submittedAt)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {active && (
        <SubmissionDrawer item={active} onClose={() => setActive(null)} onStatus={(s) => updateStatus(active.id, s)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Submission["status"] }) {
  const map: Record<Submission["status"], { l: string; cls: string }> = {
    pending: { l: "Pending", cls: "border-[rgba(244,234,213,0.3)] text-[rgba(244,234,213,0.8)]" },
    shortlisted: {
      l: "Shortlisted",
      cls: "border-[#d6ba73] text-[#e8d49a] bg-[rgba(214,186,115,0.1)]",
    },
    winner: { l: "Winner", cls: "border-[#e8d49a] text-[#0a0d18] bg-[#d6ba73]" },
    rejected: { l: "Not advanced", cls: "border-[rgba(255,150,140,0.4)] text-[#f6b8a3]" },
  };
  const m = map[status];
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] border px-3 py-1 rounded-full ${m.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {m.l}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function SubmissionDrawer({
  item,
  onClose,
  onStatus,
}: {
  item: Submission;
  onClose: () => void;
  onStatus: (s: Submission["status"]) => void;
}) {
  const projects = Object.entries(item.projects || {}).filter(([, p]) => p?.nominate);
  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="relative w-full max-w-2xl h-full overflow-y-auto bg-[#070912] border-l border-[rgba(214,186,115,0.2)] animate-rise">
        <div className="sticky top-0 z-10 bg-[rgba(7,9,18,0.95)] backdrop-blur-md border-b border-[rgba(214,186,115,0.18)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
              {item.id} · {item.clubType === "community" ? "Community-based" : "College-based"}
            </div>
            <div className="font-display text-xl mt-0.5 text-[#f4ead5]">{item.clubName}</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[rgba(214,186,115,0.3)] grid place-items-center hover:bg-[rgba(214,186,115,0.08)]"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <DrawerSection title="Club identity">
            <Info label="Club" value={`${item.clubName} (Rotary Club of ${item.parentClub})`} />
            <Info label="Club number" value={item.clubNumber} />
            <Info
              label="Eligibility"
              value={`RI dues ${item.riDuesPaid} · District dues ${item.districtDuesPaid}${
                item.clubType === "community" ? ` · Bank ${item.bankAccountActive}` : ""
              }`}
            />
            <Info label="Submitted" value={formatDate(item.submittedAt)} />
            {item.submittedBy && <Info label="Authenticated as" value={item.submittedBy} />}
          </DrawerSection>

          <DrawerSection title={`Project Nominations · ${projects.length}`}>
            {projects.length === 0 && (
              <div className="text-sm text-[rgba(244,234,213,0.55)]">No project sections filled.</div>
            )}
            {projects.map(([key, p]) => {
              const meta = PROJECT_SECTIONS.find((s) => s.key === (key as ProjectKey));
              return (
                <div key={key} className="glass rounded-xl p-4 mb-3 last:mb-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
                    {meta?.avenue} · {meta?.title}
                  </div>
                  <div className="mt-1 font-display text-lg text-[#f4ead5]">{p.name}</div>
                  <div className="text-xs text-[rgba(244,234,213,0.55)] mt-1">
                    {p.startDate} → {p.endDate} · {p.beneficiaries} beneficiaries
                  </div>
                  <div className="mt-2 text-sm text-[rgba(244,234,213,0.82)] whitespace-pre-wrap">
                    {p.overview}
                  </div>
                </div>
              );
            })}
          </DrawerSection>

          <DrawerSection title="Club Performance">
            <Block label="Self-evaluation" value={item.clubSelfEval} />
            <Pills label="District events" values={item.clubEvents} />
            <Pills label="District initiatives" values={item.clubInitiatives} />
            <Pills label="Rotary initiatives" values={item.clubRotary} />
            <Info label="Photographs" value={item.clubPhotosLink} />
          </DrawerSection>

          <DrawerSection title="Social Media · Happy Moment · Best Practice">
            <Block label="Social media" value={item.socialMediaDesc} />
            <Info label="Social links" value={item.socialMediaLinks} />
            <Block label="Happy moment" value={item.happyMomentDesc} />
            <Block label="Best practice" value={item.bestPracticeDesc} />
          </DrawerSection>

          <DrawerSection title="President">
            <OfficerCard officer={item.president} />
          </DrawerSection>
          <DrawerSection title="Secretary">
            <OfficerCard officer={item.secretary} />
          </DrawerSection>

          <DrawerSection title="Star of Rotaract">
            {item.starNominees?.map((n, i) => (
              <div key={i} className="glass rounded-xl p-4 mb-2 last:mb-0">
                <div className="font-display text-lg text-[#f4ead5]">{n.name || "—"}</div>
                <div className="text-sm text-[rgba(244,234,213,0.75)] mt-1">{n.eval}</div>
              </div>
            ))}
          </DrawerSection>
          <DrawerSection title="Favorite District Official">
            {item.favoriteDONominees?.map((n, i) => (
              <div key={i} className="glass rounded-xl p-4 mb-2 last:mb-0">
                <div className="font-display text-lg text-[#f4ead5]">{n.name || "—"}</div>
                <div className="text-sm text-[rgba(244,234,213,0.75)] mt-1">{n.eval}</div>
              </div>
            ))}
          </DrawerSection>

          <DrawerSection title="Declaration">
            <Info label="Signed by" value={item.declarationName} />
            <Info label="Role" value={item.declarationRole} />
            <Info label="Date" value={item.declarationDate} />
          </DrawerSection>
        </div>

        <div className="sticky bottom-0 bg-[rgba(7,9,18,0.97)] backdrop-blur-md border-t border-[rgba(214,186,115,0.18)] px-6 py-4 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => onStatus("rejected")}
            className="btn-ghost px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em]"
          >
            Not advanced
          </button>
          <button
            onClick={() => onStatus("pending")}
            className="btn-ghost px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em]"
          >
            Reset to pending
          </button>
          <button
            onClick={() => onStatus("shortlisted")}
            className="btn-gold px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em] font-semibold"
          >
            Shortlist
          </button>
          <button
            onClick={() => onStatus("winner")}
            className="btn-gold px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.18em] font-semibold"
          >
            Declare winner ★
          </button>
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73] mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-1 text-sm">
      <div className="text-[rgba(244,234,213,0.55)]">{label}</div>
      <div className="text-[#f4ead5] break-words">{value || "—"}</div>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.55)]">{label}</div>
      <div className="mt-1.5 text-sm text-[rgba(244,234,213,0.85)] whitespace-pre-wrap leading-relaxed">{value}</div>
    </div>
  );
}

function Pills({ label, values }: { label: string; values?: string[] }) {
  if (!values || values.length === 0) {
    return <Info label={label} value="None" />;
  }
  return (
    <div className="py-1">
      <div className="text-[rgba(244,234,213,0.55)] text-sm mb-1.5">{label}</div>
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

function OfficerCard({ officer }: { officer: OfficerData }) {
  if (!officer) return null;
  return (
    <div className="space-y-2">
      <Info label="Name" value={officer.name} />
      <Block label="Self-evaluation" value={officer.selfEval} />
      <Block label="Key contribution" value={officer.keyContrib} />
      <Block label="Consistency / leadership" value={officer.consistency} />
      <Pills label="District events" values={officer.events} />
      <Pills label="District initiatives" values={officer.initiatives} />
      <Pills label="Rotary initiatives" values={officer.rotary} />
      <Info label="DRC meetings" value={officer.drcMeetings} />
      <Info label="Close-door meetings" value={officer.closedDoorMeetings} />
      <Info label="TRF contribution" value={officer.trfContribution} />
      <Info label="Photographs" value={officer.photosLink} />
    </div>
  );
}
