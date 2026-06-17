"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FLOW,
  PROJECT_SECTIONS,
  DISTRICT_EVENTS_CLUB,
  DISTRICT_EVENTS_OFFICER,
  DISTRICT_INITIATIVES,
  ROTARY_INITIATIVES,
  type ProjectKey,
} from "@/lib/nomination-flow";
import { supabase } from "@/lib/supabase";

/* ---------------- Form state types ---------------- */

type YesNo = "yes" | "no" | "";

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

type StarNominee = { name: string; eval: string };

type FormState = {
  // Section 1 — Club Identity
  clubName: string;
  parentClub: string;
  clubNumber: string;
  clubType: "college" | "community" | "";

  // Section 2/3 — Eligibility
  riDuesPaid: YesNo;
  districtDuesPaid: YesNo;
  bankAccountActive: YesNo;
  bankProofName: string;

  // Sections 4-17 — Projects
  projects: Record<ProjectKey, ProjectEntry>;

  // Section 18 — Club Award
  clubSelfEval: string;
  clubEvents: string[];
  clubInitiatives: string[];
  clubRotary: string[];
  clubOtherRIDE: string;
  clubOtherEvents: string;
  drcMeetingsAttended: string;
  closedDoorMeetingsAttended: string;
  drcMeetingsHosted: string;
  clubTRFContribution: string;
  districtEventsHostedByClub: string;
  twinClubAgreement: string;
  districtOfficialsFromClub: string;
  collaredMeetings: string;
  clubPhotosLink: string;

  // Section 19 — Social Media
  socialMediaDesc: string;
  socialMediaLinks: string;

  // Section 20 — Happy Moment
  happyMomentDesc: string;
  happyMomentPic1: string;
  happyMomentPic2: string;
  happyMomentPic3: string;

  // Section 21 — Best Practice
  bestPracticeDesc: string;
  bestPracticePic1: string;
  bestPracticePic2: string;
  bestPracticePic3: string;

  // Section 22 — President
  president: OfficerData;

  // Section 23 — Secretary
  secretary: OfficerData;

  // Section 24 — Star of Rotaract
  starNominees: [StarNominee, StarNominee];

  // Section 25 — Favorite District Official
  favoriteDONominees: [StarNominee, StarNominee, StarNominee];

  // Section 26 — Declaration
  declarationName: string;
  declarationRole: string;
  declarationDate: string;
  declared: boolean;
  consentContact: boolean;
};

const EMPTY_PROJECT: ProjectEntry = {
  nominate: false,
  name: "",
  startDate: "",
  endDate: "",
  beneficiaries: "",
  purpose: "",
  overview: "",
  highlights: "",
  picture1: "",
  picture2: "",
  picture3: "",
  links: "",
  media: "",
};

const EMPTY_OFFICER: OfficerData = {
  name: "",
  selfEval: "",
  keyContrib: "",
  consistency: "",
  events: [],
  initiatives: [],
  rotary: [],
  otherEvents: "",
  drcMeetings: "",
  closedDoorMeetings: "",
  trfContribution: "",
  eventsHostedCoChair: "",
  photosLink: "",
};

function emptyProjects(): Record<ProjectKey, ProjectEntry> {
  const r = {} as Record<ProjectKey, ProjectEntry>;
  PROJECT_SECTIONS.forEach((p) => {
    r[p.key] = { ...EMPTY_PROJECT };
  });
  return r;
}

const EMPTY: FormState = {
  clubName: "",
  parentClub: "",
  clubNumber: "",
  clubType: "",

  riDuesPaid: "",
  districtDuesPaid: "",
  bankAccountActive: "",
  bankProofName: "",

  projects: emptyProjects(),

  clubSelfEval: "",
  clubEvents: [],
  clubInitiatives: [],
  clubRotary: [],
  clubOtherRIDE: "",
  clubOtherEvents: "",
  drcMeetingsAttended: "",
  closedDoorMeetingsAttended: "",
  drcMeetingsHosted: "",
  clubTRFContribution: "",
  districtEventsHostedByClub: "",
  twinClubAgreement: "",
  districtOfficialsFromClub: "",
  collaredMeetings: "",
  clubPhotosLink: "",

  socialMediaDesc: "",
  socialMediaLinks: "",

  happyMomentDesc: "",
  happyMomentPic1: "",
  happyMomentPic2: "",
  happyMomentPic3: "",

  bestPracticeDesc: "",
  bestPracticePic1: "",
  bestPracticePic2: "",
  bestPracticePic3: "",

  president: { ...EMPTY_OFFICER },
  secretary: { ...EMPTY_OFFICER },

  starNominees: [
    { name: "", eval: "" },
    { name: "", eval: "" },
  ],

  favoriteDONominees: [
    { name: "", eval: "" },
    { name: "", eval: "" },
    { name: "", eval: "" },
  ],

  declarationName: "",
  declarationRole: "",
  declarationDate: "",
  declared: false,
  consentContact: false,
};

const STORAGE_KEY = "rotaract-nomination-draft";

type TerminalState = null | "thank-you" | "ineligible";

export default function NominationForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [terminal, setTerminal] = useState<TerminalState>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hydrate
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData((d) => ({ ...d, ...parsed, projects: { ...d.projects, ...(parsed.projects || {}) } }));
        if (typeof parsed.__step === "number") setStep(parsed.__step);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, __step: step }));
    } catch {}
  }, [data, step, hydrated]);

  const current = FLOW[step];
  const progress = Math.round(((step + 1) / FLOW.length) * 100);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function updateProject(key: ProjectKey, partial: Partial<ProjectEntry>) {
    setData((d) => ({ ...d, projects: { ...d.projects, [key]: { ...d.projects[key], ...partial } } }));
  }

  function updateOfficer(role: "president" | "secretary", partial: Partial<OfficerData>) {
    setData((d) => ({ ...d, [role]: { ...d[role], ...partial } }));
  }

  function validateCurrent(): Record<string, string> {
    const e: Record<string, string> = {};
    const id = current.id;
    if (id === "identity") {
      if (!data.clubName.trim()) e.clubName = "Required.";
      if (!data.parentClub.trim()) e.parentClub = "Required.";
      if (!data.clubNumber.trim()) e.clubNumber = "Required.";
      if (!data.clubType) e.clubType = "Pick your club type.";
    }
    if (id === "docs") {
      if (!data.riDuesPaid) e.riDuesPaid = "Required.";
      if (!data.districtDuesPaid) e.districtDuesPaid = "Required.";
      if (data.clubType === "community") {
        if (!data.bankAccountActive) e.bankAccountActive = "Required.";
        if (data.bankAccountActive === "yes" && !data.bankProofName.trim())
          e.bankProofName = "Upload the proof.";
      }
    }
    if (id.startsWith("project:")) {
      const key = id.split(":")[1] as ProjectKey;
      const p = data.projects[key];
      if (p.nominate) {
        if (!p.name.trim()) e.projectName = "Project name is required.";
        if (!p.startDate) e.startDate = "Start date is required.";
        if (!p.endDate) e.endDate = "End date is required.";
        if (!p.beneficiaries.trim()) e.beneficiaries = "Required.";
        if (!p.purpose.trim()) e.purpose = "Required.";
        if (!p.overview.trim()) e.overview = "Required.";
        if (!p.highlights.trim()) e.highlights = "Required.";
        if (!p.picture1 || !p.picture2 || !p.picture3) e.pictures = "Attach all three pictures.";
      }
    }
    if (id === "club-award") {
      if (!data.clubSelfEval.trim()) e.clubSelfEval = "Required.";
      if (!data.drcMeetingsAttended.trim()) e.drcMeetingsAttended = "Required.";
      if (!data.closedDoorMeetingsAttended.trim()) e.closedDoorMeetingsAttended = "Required.";
      if (!data.clubTRFContribution.trim()) e.clubTRFContribution = "Required.";
      if (!data.clubPhotosLink.trim()) e.clubPhotosLink = "Drive link is required.";
    }
    if (id === "social-media") {
      if (!data.socialMediaDesc.trim()) e.socialMediaDesc = "Required.";
      if (!data.socialMediaLinks.trim()) e.socialMediaLinks = "Required.";
    }
    if (id === "happy-moment") {
      if (!data.happyMomentDesc.trim()) e.happyMomentDesc = "Required.";
    }
    if (id === "best-practice") {
      if (!data.bestPracticeDesc.trim()) e.bestPracticeDesc = "Required.";
    }
    if (id === "president" || id === "secretary") {
      const o = id === "president" ? data.president : data.secretary;
      if (!o.name.trim()) e.officerName = "Name is required.";
      if (!o.selfEval.trim()) e.selfEval = "Required.";
      if (!o.keyContrib.trim()) e.keyContrib = "Required.";
      if (!o.consistency.trim()) e.consistency = "Required.";
      if (!o.drcMeetings.trim()) e.drcMeetings = "Required.";
      if (!o.closedDoorMeetings.trim()) e.closedDoorMeetings = "Required.";
      if (!o.trfContribution.trim()) e.trfContribution = "Required.";
      if (!o.photosLink.trim()) e.photosLink = "Drive link is required.";
    }
    if (id === "star-of-rotaract") {
      data.starNominees.forEach((n, i) => {
        if (!n.name.trim()) e[`star-name-${i}`] = "Required.";
        if (!n.eval.trim()) e[`star-eval-${i}`] = "Required.";
      });
    }
    if (id === "favorite-do") {
      data.favoriteDONominees.forEach((n, i) => {
        if (!n.name.trim()) e[`do-name-${i}`] = "Required.";
        if (!n.eval.trim()) e[`do-eval-${i}`] = "Required.";
      });
    }
    if (id === "declaration") {
      if (!data.declarationName.trim()) e.declarationName = "Sign with your full name.";
      if (!data.declared) e.declared = "Please confirm the declaration.";
    }
    return e;
  }

  function evaluateEligibility(): boolean {
    if (data.riDuesPaid !== "yes") return false;
    if (data.districtDuesPaid !== "yes") return false;
    if (data.clubType === "community" && data.bankAccountActive !== "yes") return false;
    return true;
  }

  function goNext() {
    const e = validateCurrent();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (current.id === "docs" && !evaluateEligibility()) {
      setTerminal("ineligible");
      return;
    }

    if (step === FLOW.length - 1) {
      submit();
      return;
    }

    setStep((s) => Math.min(FLOW.length - 1, s + 1));
    setErrors({});
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    setErrors({});
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    const id = "RDA-" + Date.now().toString(36).toUpperCase();
    
    const submission = {
      id,
      submittedAt: new Date().toISOString(),
      status: "pending",
      clubName: data.clubName,
      parentClub: data.parentClub,
      clubNumber: data.clubNumber,
      clubType: data.clubType,
      riDuesPaid: data.riDuesPaid,
      districtDuesPaid: data.districtDuesPaid,
      bankAccountActive: data.bankAccountActive || null,
      bankProofName: data.bankProofName || null,
      projects: data.projects,
      clubSelfEval: data.clubSelfEval,
      clubEvents: data.clubEvents,
      clubInitiatives: data.clubInitiatives,
      clubRotary: data.clubRotary,
      clubOtherRIDE: data.clubOtherRIDE || null,
      clubOtherEvents: data.clubOtherEvents || null,
      drcMeetingsAttended: data.drcMeetingsAttended || null,
      closedDoorMeetingsAttended: data.closedDoorMeetingsAttended || null,
      drcMeetingsHosted: data.drcMeetingsHosted || null,
      clubTRFContribution: data.clubTRFContribution || null,
      districtEventsHostedByClub: data.districtEventsHostedByClub || null,
      twinClubAgreement: data.twinClubAgreement || null,
      districtOfficialsFromClub: data.districtOfficialsFromClub || null,
      collaredMeetings: data.collaredMeetings || null,
      clubPhotosLink: data.clubPhotosLink,
      socialMediaDesc: data.socialMediaDesc,
      socialMediaLinks: data.socialMediaLinks,
      happyMomentDesc: data.happyMomentDesc,
      happyMomentPic1: data.happyMomentPic1 || null,
      happyMomentPic2: data.happyMomentPic2 || null,
      happyMomentPic3: data.happyMomentPic3 || null,
      bestPracticeDesc: data.bestPracticeDesc,
      bestPracticePic1: data.bestPracticePic1 || null,
      bestPracticePic2: data.bestPracticePic2 || null,
      bestPracticePic3: data.bestPracticePic3 || null,
      president: data.president,
      secretary: data.secretary,
      starNominees: data.starNominees,
      favoriteDONominees: data.favoriteDONominees,
      declarationName: data.declarationName,
      declarationRole: data.declarationRole,
      declarationDate: data.declarationDate,
      declared: data.declared,
      consentContact: data.consentContact,
    };

    try {
      const { error } = await supabase.from("submissions").insert([submission]);
      if (error) {
        throw error;
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      setSubmittedId(id);
      setTerminal("thank-you");
    } catch (err: any) {
      console.error("Error submitting nomination to Supabase:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setData(EMPTY);
    setStep(0);
    setErrors({});
    setTerminal(null);
    setSubmittedId(null);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }

  /* ---------- Terminal screens ---------- */
  if (terminal === "ineligible") {
    return <IneligibilityCard onReset={() => setTerminal(null)} />;
  }
  if (terminal === "thank-you") {
    return <ThankYouCard id={submittedId || "RDA-XXXX"} onRestart={restart} />;
  }

  /* ---------- Active form ---------- */
  return (
    <div className="glass-strong rounded-3xl overflow-hidden">
      <ProgressRail step={step} progress={progress} group={current.group} />

      <div className="p-6 sm:p-10">
        <SectionHeading group={current.group} step={step} title={current.title} subtitle={current.subtitle} />

        <div className="mt-8 animate-rise" key={current.id}>
          {current.id === "identity" && (
            <IdentitySection data={data} update={update} errors={errors} />
          )}
          {current.id === "docs" && (
            <DocsSection data={data} update={update} errors={errors} />
          )}
          {current.id.startsWith("project:") && (
            <ProjectSection
              projectKey={current.id.split(":")[1] as ProjectKey}
              data={data}
              updateProject={updateProject}
              errors={errors}
            />
          )}
          {current.id === "club-award" && (
            <ClubAwardSection data={data} update={update} errors={errors} />
          )}
          {current.id === "social-media" && (
            <SocialMediaSection data={data} update={update} errors={errors} />
          )}
          {current.id === "happy-moment" && (
            <HappyMomentSection data={data} update={update} errors={errors} />
          )}
          {current.id === "best-practice" && (
            <BestPracticeSection data={data} update={update} errors={errors} />
          )}
          {current.id === "president" && (
            <OfficerSection
              role="president"
              data={data.president}
              update={(p) => updateOfficer("president", p)}
              errors={errors}
            />
          )}
          {current.id === "secretary" && (
            <OfficerSection
              role="secretary"
              data={data.secretary}
              update={(p) => updateOfficer("secretary", p)}
              errors={errors}
            />
          )}
          {current.id === "star-of-rotaract" && (
            <StarOfRotaractSection data={data} update={update} errors={errors} />
          )}
          {current.id === "favorite-do" && (
            <FavoriteDOSection data={data} update={update} errors={errors} />
          )}
          {current.id === "declaration" && (
            <DeclarationSection data={data} update={update} errors={errors} />
          )}
        </div>

        {submitError && (
          <div className="mt-6 p-4 rounded-xl border border-[rgba(255,150,140,0.3)] bg-[rgba(255,150,140,0.06)] text-sm text-[#f6b8a3]">
            <strong>Submission failed:</strong> {submitError}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-[rgba(214,186,115,0.16)] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.5)]">
            Auto-saved · Section {step + 1} of {FLOW.length}
          </div>
          <div className="flex items-center gap-3 justify-end">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="btn-ghost px-6 py-2.5 rounded-full text-sm disabled:opacity-50"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="btn-gold px-7 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : step === FLOW.length - 1 ? (
                "Submit Nomination"
              ) : (
                "Continue →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Progress + heading
   ========================================================= */

function ProgressRail({ step, progress, group }: { step: number; progress: number; group: string }) {
  return (
    <div className="relative bg-[rgba(10,13,24,0.6)] border-b border-[rgba(214,186,115,0.18)] px-6 sm:px-10 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.65)]">
          <span className="chip">{group}</span>
          <span>Section {step + 1} / {FLOW.length}</span>
        </div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73]">{progress}%</div>
      </div>
      <div className="mt-3 h-px bg-[rgba(214,186,115,0.18)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#e8d49a] via-[#d6ba73] to-[#a8893e] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  group,
  step,
  title,
  subtitle,
}: {
  group: string;
  step: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#d6ba73]">
        {group} · Step {step + 1}
      </div>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl text-[rgba(244,234,213,0.95)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[rgba(244,234,213,0.6)]">{subtitle}</p>
    </div>
  );
}

/* =========================================================
   Shared field components
   ========================================================= */

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="input-label">
        {label}
        {required && <span className="text-[#d6ba73] ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <div className="input-help">{hint}</div>}
      {error && <div className="mt-2 text-xs text-[#f6b8a3]">{error}</div>}
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["yes", "no"] as const).map((v) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          className={`p-3 rounded-xl border text-sm capitalize transition-all ${
            value === v
              ? "border-[#d6ba73] bg-[rgba(214,186,115,0.1)] ring-gold text-[#f4ead5]"
              : "border-[rgba(214,186,115,0.18)] text-[rgba(244,234,213,0.75)] hover:border-[rgba(214,186,115,0.4)]"
          }`}
        >
          {v === "yes" ? yesLabel : noLabel}
        </button>
      ))}
    </div>
  );
}

function CheckboxList({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(opt: string) {
    const has = value.includes(opt);
    onChange(has ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-start gap-3 text-left p-3 rounded-xl border transition-all ${
              active
                ? "border-[#d6ba73] bg-[rgba(214,186,115,0.1)]"
                : "border-[rgba(214,186,115,0.18)] hover:border-[rgba(214,186,115,0.4)]"
            }`}
          >
            <span
              className={`mt-0.5 w-4 h-4 rounded-sm border grid place-items-center shrink-0 ${
                active ? "border-[#d6ba73] bg-[#d6ba73]" : "border-[rgba(214,186,115,0.5)]"
              }`}
            >
              {active && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4L19 7"
                    stroke="#0a0d18"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-sm text-[rgba(244,234,213,0.85)]">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function WordCount({ text, max }: { text: string; max: number }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const over = words > max;
  return (
    <div
      className={`mt-2 text-xs ${over ? "text-[#f6b8a3]" : "text-[rgba(244,234,213,0.5)]"}`}
    >
      {words} / {max} words
      {over && " · please trim"}
    </div>
  );
}

function FileField({
  label,
  value,
  onChange,
  accept = "image/*",
  hint,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (name: string) => void;
  accept?: string;
  hint?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <label className="block">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0]?.name || "")}
        />
        <div
          className={`input-field flex items-center justify-between cursor-pointer ${
            value ? "border-[rgba(214,186,115,0.5)]" : ""
          }`}
        >
          <span className={value ? "text-[#f4ead5]" : "text-[rgba(244,234,213,0.5)]"}>
            {value || "Choose a file…"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">Upload</span>
        </div>
      </label>
    </Field>
  );
}

/* =========================================================
   Section 1 — Club Identity
   ========================================================= */

function IdentitySection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-5">
      <Field label="Club Name" hint="Prefix 'Rotaract Club of'" error={errors.clubName} required>
        <input
          className="input-field"
          value={data.clubName}
          onChange={(e) => update("clubName", e.target.value)}
          placeholder="Rotaract Club of ____"
        />
      </Field>
      <Field label="Parent Club Name" hint="Prefix 'Rotary Club of'" error={errors.parentClub} required>
        <input
          className="input-field"
          value={data.parentClub}
          onChange={(e) => update("parentClub", e.target.value)}
          placeholder="Rotary Club of ____"
        />
      </Field>
      <Field label="Club Number" hint="Club ID as per Rotary International" error={errors.clubNumber} required>
        <input
          className="input-field"
          value={data.clubNumber}
          onChange={(e) => update("clubNumber", e.target.value)}
          placeholder="e.g. 88791"
        />
      </Field>
      <Field label="Club Type" error={errors.clubType} required>
        <div className="grid sm:grid-cols-2 gap-3">
          {(
            [
              { v: "college", l: "College-based Club", d: "Chartered through an institution." },
              { v: "community", l: "Community-based Club", d: "Independent community-rooted club." },
            ] as const
          ).map((opt) => {
            const active = data.clubType === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => update("clubType", opt.v)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? "border-[#d6ba73] bg-[rgba(214,186,115,0.1)] ring-gold"
                    : "border-[rgba(214,186,115,0.18)] hover:border-[rgba(214,186,115,0.4)]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">Select</div>
                <div className="mt-1 font-display text-xl text-[#f4ead5]">{opt.l}</div>
                <div className="mt-1 text-xs text-[rgba(244,234,213,0.6)]">{opt.d}</div>
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

/* =========================================================
   Section 2/3 — Document Validation
   ========================================================= */

function DocsSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-6">
      <div className="glass rounded-2xl p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
          {data.clubType === "community"
            ? "Community-based Club · Document Validation"
            : "College-based Club · Document Validation"}
        </div>
        <p className="mt-2 text-sm text-[rgba(244,234,213,0.65)]">
          Any "No" answer here will route the nomination to the Ineligibility Notice — please answer
          honestly. The full form unlocks only when every gate clears.
        </p>
      </div>

      <Field label="RI Dues paid for 2025-26" error={errors.riDuesPaid} required>
        <YesNoToggle value={data.riDuesPaid} onChange={(v) => update("riDuesPaid", v)} />
      </Field>
      <Field label="District Dues paid for 2025-26" error={errors.districtDuesPaid} required>
        <YesNoToggle value={data.districtDuesPaid} onChange={(v) => update("districtDuesPaid", v)} />
      </Field>

      {data.clubType === "community" && (
        <>
          <Field label="Does your club have an active bank account?" error={errors.bankAccountActive} required>
            <YesNoToggle
              value={data.bankAccountActive}
              onChange={(v) => update("bankAccountActive", v)}
            />
          </Field>
          {data.bankAccountActive === "yes" && (
            <FileField
              label="Upload proof of an active bank account"
              value={data.bankProofName}
              onChange={(name) => update("bankProofName", name)}
              accept="application/pdf,image/*"
              hint="Latest statement or letter from the bank (PDF or image, max 4 MB)."
              required
              error={errors.bankProofName}
            />
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   Sections 4-17 — Project Sections (with recommendation A toggle)
   ========================================================= */

function ProjectSection({
  projectKey,
  data,
  updateProject,
  errors,
}: {
  projectKey: ProjectKey;
  data: FormState;
  updateProject: (k: ProjectKey, p: Partial<ProjectEntry>) => void;
  errors: Record<string, string>;
}) {
  const project = data.projects[projectKey];
  const meta = PROJECT_SECTIONS.find((p) => p.key === projectKey)!;

  return (
    <div className="grid gap-5">
      <div className="glass rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
            {meta.avenue} avenue
          </div>
          <div className="mt-1 font-display text-2xl text-[#f4ead5]">{meta.title}</div>
          <p className="mt-1 text-sm text-[rgba(244,234,213,0.65)] max-w-xl">{meta.description}</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer text-sm shrink-0">
          <span className="text-[rgba(244,234,213,0.7)]">Nominate in this category</span>
          <span
            onClick={() => updateProject(projectKey, { nominate: !project.nominate })}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              project.nominate ? "bg-[#d6ba73]" : "bg-[rgba(214,186,115,0.2)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-[#0a0d18] border border-[rgba(244,234,213,0.5)] transition-transform ${
                project.nominate ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </span>
        </label>
      </div>

      {!project.nominate && (
        <div className="glass rounded-2xl p-5 text-sm text-[rgba(244,234,213,0.65)]">
          Skip this section if your club did not run a project in this category. You can come back
          to it at any time — your draft is auto-saved.
        </div>
      )}

      {project.nominate && (
        <>
          <Field label="Project Name" error={errors.projectName} required>
            <input
              className="input-field"
              value={project.name}
              onChange={(e) => updateProject(projectKey, { name: e.target.value })}
              placeholder="Give the project its full title"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Project Start Date" error={errors.startDate} required>
              <input
                type="date"
                className="input-field"
                value={project.startDate}
                onChange={(e) => updateProject(projectKey, { startDate: e.target.value })}
              />
            </Field>
            <Field label="Project End Date" error={errors.endDate} required>
              <input
                type="date"
                className="input-field"
                value={project.endDate}
                onChange={(e) => updateProject(projectKey, { endDate: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Number of Beneficiaries"
            error={errors.beneficiaries}
            hint="Enter only numbers."
            required
          >
            <input
              type="number"
              className="input-field"
              value={project.beneficiaries}
              onChange={(e) => updateProject(projectKey, { beneficiaries: e.target.value })}
              placeholder="e.g. 1247"
            />
          </Field>
          <Field
            label="Purpose of the Project"
            error={errors.purpose}
            hint="One concise line."
            required
          >
            <input
              className="input-field"
              value={project.purpose}
              onChange={(e) => updateProject(projectKey, { purpose: e.target.value })}
              placeholder="The reason this project existed."
            />
          </Field>
          <Field
            label="Overview of the Project"
            error={errors.overview}
            required
          >
            <textarea
              className="input-field min-h-[110px]"
              value={project.overview}
              onChange={(e) => updateProject(projectKey, { overview: e.target.value })}
              placeholder="Within 100 words: what it was, who it served, why it mattered."
            />
            <WordCount text={project.overview} max={100} />
          </Field>
          <Field
            label="Highlights of the Project"
            error={errors.highlights}
            hint="Three outcome or impact points."
            required
          >
            <textarea
              className="input-field min-h-[110px]"
              value={project.highlights}
              onChange={(e) => updateProject(projectKey, { highlights: e.target.value })}
              placeholder={"1. …\n2. …\n3. …"}
            />
          </Field>
          <div className="glass rounded-2xl p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73] mb-3">
              Project Pictures · 3 required, ≤4 MB each
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <FileField
                label="Picture 1"
                value={project.picture1}
                onChange={(n) => updateProject(projectKey, { picture1: n })}
              />
              <FileField
                label="Picture 2"
                value={project.picture2}
                onChange={(n) => updateProject(projectKey, { picture2: n })}
              />
              <FileField
                label="Picture 3"
                value={project.picture3}
                onChange={(n) => updateProject(projectKey, { picture3: n })}
              />
            </div>
            {errors.pictures && (
              <div className="mt-2 text-xs text-[#f6b8a3]">{errors.pictures}</div>
            )}
          </div>
          <Field label="Any other related links" hint="Optional.">
            <input
              className="input-field"
              value={project.links}
              onChange={(e) => updateProject(projectKey, { links: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Field label="Any media publication" hint="Optional.">
            <input
              className="input-field"
              value={project.media}
              onChange={(e) => updateProject(projectKey, { media: e.target.value })}
              placeholder="Newspaper, magazine or PR coverage"
            />
          </Field>
        </>
      )}
    </div>
  );
}

/* =========================================================
   Section 18 — Club Award
   ========================================================= */

function ClubAwardSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-6">
      <Field
        label="Club Performance Self-Evaluation"
        error={errors.clubSelfEval}
        hint="Within 300 words."
        required
      >
        <textarea
          className="input-field min-h-[160px]"
          value={data.clubSelfEval}
          onChange={(e) => update("clubSelfEval", e.target.value)}
          placeholder="Tell us the story of your club's year — wins, lessons, identity."
        />
        <WordCount text={data.clubSelfEval} max={300} />
      </Field>

      <Field label="District Events Participated" required>
        <CheckboxList
          options={DISTRICT_EVENTS_CLUB}
          value={data.clubEvents}
          onChange={(v) => update("clubEvents", v)}
        />
      </Field>

      <Field label="Supported District Initiatives" required>
        <CheckboxList
          options={DISTRICT_INITIATIVES}
          value={data.clubInitiatives}
          onChange={(v) => update("clubInitiatives", v)}
        />
      </Field>

      <Field label="Supported Rotary Initiatives" required>
        <CheckboxList
          options={ROTARY_INITIATIVES}
          value={data.clubRotary}
          onChange={(v) => update("clubRotary", v)}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Attended any other district RIDE" required>
          <input
            className="input-field"
            value={data.clubOtherRIDE}
            onChange={(e) => update("clubOtherRIDE", e.target.value)}
            placeholder="If no, mention No"
          />
        </Field>
        <Field label="Attended any other district / MDIO events" required>
          <input
            className="input-field"
            value={data.clubOtherEvents}
            onChange={(e) => update("clubOtherEvents", e.target.value)}
            placeholder="If no, mention No"
          />
        </Field>
        <Field
          label="District Rotaract Council Meetings Attended"
          error={errors.drcMeetingsAttended}
          hint="Enter only numbers."
          required
        >
          <input
            type="number"
            className="input-field"
            value={data.drcMeetingsAttended}
            onChange={(e) => update("drcMeetingsAttended", e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field
          label="Close Door Meetings Attended (President + Secretary)"
          error={errors.closedDoorMeetingsAttended}
          hint="Enter only numbers."
          required
        >
          <input
            type="number"
            className="input-field"
            value={data.closedDoorMeetingsAttended}
            onChange={(e) => update("closedDoorMeetingsAttended", e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="District Rotaract Council Meetings Hosted" required>
          <input
            className="input-field"
            value={data.drcMeetingsHosted}
            onChange={(e) => update("drcMeetingsHosted", e.target.value)}
            placeholder="If none, mention No"
          />
        </Field>
        <Field
          label="Contribution to TRF during 2025-26"
          error={errors.clubTRFContribution}
          hint="Amount in USD."
          required
        >
          <input
            className="input-field"
            value={data.clubTRFContribution}
            onChange={(e) => update("clubTRFContribution", e.target.value)}
            placeholder="USD 0"
          />
        </Field>
        <Field label="District Events Hosted" required>
          <input
            className="input-field"
            value={data.districtEventsHostedByClub}
            onChange={(e) => update("districtEventsHostedByClub", e.target.value)}
            placeholder="Comma-separated list (or No)"
          />
        </Field>
        <Field label="Twin / Sister Club agreement for 2025-26" required>
          <input
            className="input-field"
            value={data.twinClubAgreement}
            onChange={(e) => update("twinClubAgreement", e.target.value)}
            placeholder="If your club has completed any twin club agreement, name them. If no, mention No."
          />
        </Field>
        <Field
          label="Number of District Officials from the Club"
          hint="Enter only numbers."
          required
        >
          <input
            type="number"
            className="input-field"
            value={data.districtOfficialsFromClub}
            onChange={(e) => update("districtOfficialsFromClub", e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field
          label="Number of Collared Meetings Held"
          hint="Enter only numbers."
          required
        >
          <input
            type="number"
            className="input-field"
            value={data.collaredMeetings}
            onChange={(e) => update("collaredMeetings", e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <Field
        label="Submission of Supporting Photographs"
        error={errors.clubPhotosLink}
        hint="Google Drive open-access link."
        required
      >
        <input
          className="input-field"
          value={data.clubPhotosLink}
          onChange={(e) => update("clubPhotosLink", e.target.value)}
          placeholder="https://drive.google.com/…"
        />
      </Field>
    </div>
  );
}

/* =========================================================
   Section 19 — Social Media
   ========================================================= */

function SocialMediaSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-5">
      <Field
        label="Social media effectiveness and innovation"
        error={errors.socialMediaDesc}
        hint="Within 300 words. Walk us through cadence, voice, campaigns and outcomes."
        required
      >
        <textarea
          className="input-field min-h-[160px]"
          value={data.socialMediaDesc}
          onChange={(e) => update("socialMediaDesc", e.target.value)}
          placeholder="The story of how your club showed up online this year."
        />
        <WordCount text={data.socialMediaDesc} max={300} />
      </Field>
      <Field
        label="Links to social media pages"
        error={errors.socialMediaLinks}
        hint="Format: Instagram - https://…, Facebook - https://…"
        required
      >
        <textarea
          className="input-field min-h-[100px]"
          value={data.socialMediaLinks}
          onChange={(e) => update("socialMediaLinks", e.target.value)}
          placeholder={"Instagram - …\nFacebook - …\nLinkedIn - …"}
        />
      </Field>
    </div>
  );
}

/* =========================================================
   Section 20 — Happy Moment
   ========================================================= */

function HappyMomentSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-5">
      <Field
        label="A member initiative or practice for a happy club culture"
        error={errors.happyMomentDesc}
        hint="Within 150 words."
        required
      >
        <textarea
          className="input-field min-h-[130px]"
          value={data.happyMomentDesc}
          onChange={(e) => update("happyMomentDesc", e.target.value)}
          placeholder="A ritual, a tradition, a tiny weekly thing that built belonging."
        />
        <WordCount text={data.happyMomentDesc} max={150} />
      </Field>
      <div className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73] mb-3">
          Supporting pictures · optional, up to 3, ≤4 MB each
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <FileField
            label="Picture 1"
            value={data.happyMomentPic1}
            onChange={(n) => update("happyMomentPic1", n)}
          />
          <FileField
            label="Picture 2"
            value={data.happyMomentPic2}
            onChange={(n) => update("happyMomentPic2", n)}
          />
          <FileField
            label="Picture 3"
            value={data.happyMomentPic3}
            onChange={(n) => update("happyMomentPic3", n)}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Section 21 — Best Practice
   ========================================================= */

function BestPracticeSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-5">
      <Field
        label="A best practice for club performance and quality"
        error={errors.bestPracticeDesc}
        hint="Within 200 words."
        required
      >
        <textarea
          className="input-field min-h-[140px]"
          value={data.bestPracticeDesc}
          onChange={(e) => update("bestPracticeDesc", e.target.value)}
          placeholder="A repeatable practice that lifted the club's operating standard."
        />
        <WordCount text={data.bestPracticeDesc} max={200} />
      </Field>
      <div className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73] mb-3">
          Supporting pictures · optional, up to 3, ≤4 MB each
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <FileField
            label="Picture 1"
            value={data.bestPracticePic1}
            onChange={(n) => update("bestPracticePic1", n)}
          />
          <FileField
            label="Picture 2"
            value={data.bestPracticePic2}
            onChange={(n) => update("bestPracticePic2", n)}
          />
          <FileField
            label="Picture 3"
            value={data.bestPracticePic3}
            onChange={(n) => update("bestPracticePic3", n)}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Section 22 / 23 — Officer (President or Secretary)
   ========================================================= */

function OfficerSection({
  role,
  data,
  update,
  errors,
}: {
  role: "president" | "secretary";
  data: OfficerData;
  update: (p: Partial<OfficerData>) => void;
  errors: Record<string, string>;
}) {
  const isPresident = role === "president";
  return (
    <div className="grid gap-5">
      <div className="glass rounded-2xl p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
          Self-evaluation · to be completed by the club{" "}
          {isPresident ? "President" : "Secretary"}
        </div>
        <p className="mt-2 text-sm text-[rgba(244,234,213,0.65)]">
          Speak in first person. Score yourself like a jury would — frank, generous, evidence-led.
        </p>
      </div>

      <Field label={`${isPresident ? "President" : "Secretary"}'s Full Name`} error={errors.officerName} required>
        <input
          className="input-field"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder={isPresident ? "Rtr. Name" : "Rtr. Name"}
        />
      </Field>

      <Field
        label={
          isPresident
            ? "Self-Evaluation of Performance"
            : "Overall Performance and Responsibilities"
        }
        error={errors.selfEval}
        hint="Within 200 words."
        required
      >
        <textarea
          className="input-field min-h-[140px]"
          value={data.selfEval}
          onChange={(e) => update({ selfEval: e.target.value })}
          placeholder="Frame the year, then the wins, then what you'd repeat."
        />
        <WordCount text={data.selfEval} max={200} />
      </Field>

      <Field
        label={isPresident ? "Key Contributions and Impact" : "Efficiency and Contribution"}
        error={errors.keyContrib}
        hint="Within 100 words."
        required
      >
        <textarea
          className="input-field min-h-[110px]"
          value={data.keyContrib}
          onChange={(e) => update({ keyContrib: e.target.value })}
          placeholder="The 1–2 things that wouldn't have happened without you."
        />
        <WordCount text={data.keyContrib} max={100} />
      </Field>

      <Field
        label={isPresident ? "Leadership, Commitment and Support" : "Consistency and Support"}
        error={errors.consistency}
        hint="Within 100 words."
        required
      >
        <textarea
          className="input-field min-h-[110px]"
          value={data.consistency}
          onChange={(e) => update({ consistency: e.target.value })}
          placeholder="How you showed up, week after week."
        />
        <WordCount text={data.consistency} max={100} />
      </Field>

      <Field label={`District Events Participated by ${isPresident ? "President" : "Secretary"}`} required>
        <CheckboxList
          options={DISTRICT_EVENTS_OFFICER}
          value={data.events}
          onChange={(v) => update({ events: v })}
        />
      </Field>

      <Field label={`Supported District Initiatives by ${isPresident ? "President" : "Secretary"}`} required>
        <CheckboxList
          options={DISTRICT_INITIATIVES}
          value={data.initiatives}
          onChange={(v) => update({ initiatives: v })}
        />
      </Field>

      <Field label={`Supported Rotary Initiatives by ${isPresident ? "President" : "Secretary"}`} required>
        <CheckboxList
          options={ROTARY_INITIATIVES}
          value={data.rotary}
          onChange={(v) => update({ rotary: v })}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Attended any other district / MDIO events" required>
          <input
            className="input-field"
            value={data.otherEvents}
            onChange={(e) => update({ otherEvents: e.target.value })}
            placeholder="If no, mention No"
          />
        </Field>
        <Field
          label="District Rotaract Council Meetings Attended"
          error={errors.drcMeetings}
          hint="Enter only numbers."
          required
        >
          <input
            type="number"
            className="input-field"
            value={data.drcMeetings}
            onChange={(e) => update({ drcMeetings: e.target.value })}
            placeholder="0"
          />
        </Field>
        <Field
          label="Close Door Meetings Attended"
          error={errors.closedDoorMeetings}
          hint="Enter only numbers."
          required
        >
          <input
            type="number"
            className="input-field"
            value={data.closedDoorMeetings}
            onChange={(e) => update({ closedDoorMeetings: e.target.value })}
            placeholder="0"
          />
        </Field>
        <Field label="Contribution to TRF during 2025-26" error={errors.trfContribution} required>
          <input
            className="input-field"
            value={data.trfContribution}
            onChange={(e) => update({ trfContribution: e.target.value })}
            placeholder="USD 0"
          />
        </Field>
      </div>

      <Field label="District Events Hosted as Co-Chairperson / Secretary" required>
        <input
          className="input-field"
          value={data.eventsHostedCoChair}
          onChange={(e) => update({ eventsHostedCoChair: e.target.value })}
          placeholder="If no, mention No"
        />
      </Field>

      <Field
        label="Submission of Supporting Photographs"
        error={errors.photosLink}
        hint="Google Drive open-access link."
        required
      >
        <input
          className="input-field"
          value={data.photosLink}
          onChange={(e) => update({ photosLink: e.target.value })}
          placeholder="https://drive.google.com/…"
        />
      </Field>
    </div>
  );
}

/* =========================================================
   Section 24 — Star of Rotaract
   ========================================================= */

function StarOfRotaractSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-6">
      <div className="glass rounded-2xl p-5 text-sm text-[rgba(244,234,213,0.7)]">
        Nominate two Rotaractors from your club. Each evaluation can be up to 50 words.
      </div>

      {data.starNominees.map((n, i) => (
        <div key={i} className="glass rounded-2xl p-6 grid gap-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">Nominee {i + 1}</div>
          <Field
            label="Name of the Nominee"
            error={errors[`star-name-${i}`]}
            hint="Format: Rtr. Name"
            required
          >
            <input
              className="input-field"
              value={n.name}
              onChange={(e) => {
                const next: [StarNominee, StarNominee] = [...data.starNominees] as [
                  StarNominee,
                  StarNominee,
                ];
                next[i] = { ...next[i], name: e.target.value };
                update("starNominees", next);
              }}
              placeholder="Rtr. Full Name"
            />
          </Field>
          <Field
            label="Star of Rotaract nomination & evaluation"
            error={errors[`star-eval-${i}`]}
            hint="Within 50 words."
            required
          >
            <textarea
              className="input-field min-h-[100px]"
              value={n.eval}
              onChange={(e) => {
                const next: [StarNominee, StarNominee] = [...data.starNominees] as [
                  StarNominee,
                  StarNominee,
                ];
                next[i] = { ...next[i], eval: e.target.value };
                update("starNominees", next);
              }}
              placeholder="What made them a Star this year?"
            />
            <WordCount text={n.eval} max={50} />
          </Field>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   Section 25 — Favorite District Official
   ========================================================= */

function FavoriteDOSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-6">
      <div className="glass rounded-2xl p-5 text-sm text-[rgba(244,234,213,0.7)]">
        Nominate three district officials your club loved working with. Each evaluation can be up to
        50 words.
      </div>

      {data.favoriteDONominees.map((n, i) => (
        <div key={i} className="glass rounded-2xl p-6 grid gap-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">Nominee {i + 1}</div>
          <Field
            label="Name of the District Official"
            error={errors[`do-name-${i}`]}
            hint="Format: Rtr. Name"
            required
          >
            <input
              className="input-field"
              value={n.name}
              onChange={(e) => {
                const next: [StarNominee, StarNominee, StarNominee] = [
                  ...data.favoriteDONominees,
                ] as [StarNominee, StarNominee, StarNominee];
                next[i] = { ...next[i], name: e.target.value };
                update("favoriteDONominees", next);
              }}
              placeholder="Rtr. Full Name"
            />
          </Field>
          <Field
            label="Favorite District Official nomination"
            error={errors[`do-eval-${i}`]}
            hint="Within 50 words."
            required
          >
            <textarea
              className="input-field min-h-[100px]"
              value={n.eval}
              onChange={(e) => {
                const next: [StarNominee, StarNominee, StarNominee] = [
                  ...data.favoriteDONominees,
                ] as [StarNominee, StarNominee, StarNominee];
                next[i] = { ...next[i], eval: e.target.value };
                update("favoriteDONominees", next);
              }}
              placeholder="Why your club championed them."
            />
            <WordCount text={n.eval} max={50} />
          </Field>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   Final section — Declaration
   ========================================================= */

function DeclarationSection({
  data,
  update,
  errors,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
}) {
  const projectCount = useMemo(
    () => Object.values(data.projects).filter((p) => p.nominate).length,
    [data.projects]
  );
  return (
    <div className="grid gap-6">
      <ReviewSummary data={data} projectCount={projectCount} />
      <div className="glass rounded-2xl p-6">
        <div className="font-display text-2xl text-[rgba(244,234,213,0.95)]">Declaration</div>
        <p className="text-sm text-[rgba(244,234,213,0.65)] mt-2 leading-relaxed">
          I confirm that the information provided is accurate to the best of my knowledge, that the
          club office bearers are aware of this nomination, and that the jury's decision will be
          final and binding.
        </p>

        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          <Field label="Sign with your full name" error={errors.declarationName} required>
            <input
              className="input-field"
              value={data.declarationName}
              onChange={(e) => update("declarationName", e.target.value)}
              placeholder="Type your full name"
            />
          </Field>
          <Field label="Role in the club">
            <input
              className="input-field"
              value={data.declarationRole}
              onChange={(e) => update("declarationRole", e.target.value)}
              placeholder="President / Secretary / Other"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="input-field"
              value={data.declarationDate}
              onChange={(e) => update("declarationDate", e.target.value)}
            />
          </Field>
        </div>

        <label className="mt-5 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.declared}
            onChange={(e) => update("declared", e.target.checked)}
            className="mt-1 accent-[#d6ba73] w-4 h-4"
          />
          <span className="text-sm text-[rgba(244,234,213,0.85)] leading-relaxed">
            I confirm the declaration above and accept the District's nomination terms.
          </span>
        </label>
        {errors.declared && <div className="mt-2 text-xs text-[#f6b8a3]">{errors.declared}</div>}

        <label className="mt-3 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.consentContact}
            onChange={(e) => update("consentContact", e.target.checked)}
            className="mt-1 accent-[#d6ba73] w-4 h-4"
          />
          <span className="text-sm text-[rgba(244,234,213,0.85)] leading-relaxed">
            The District Awards Committee may contact me for clarifications.
          </span>
        </label>
      </div>
    </div>
  );
}

function ReviewSummary({ data, projectCount }: { data: FormState; projectCount: number }) {
  const rows: { l: string; v: string }[] = [
    { l: "Club", v: `${data.clubName || "—"} · ${data.parentClub || ""}` },
    { l: "Club number", v: data.clubNumber || "—" },
    { l: "Club type", v: data.clubType === "community" ? "Community-based" : data.clubType === "college" ? "College-based" : "—" },
    { l: "Eligibility", v: "RI dues · " + (data.riDuesPaid || "—") + "  ·  District dues · " + (data.districtDuesPaid || "—") + (data.clubType === "community" ? "  ·  Bank · " + (data.bankAccountActive || "—") : "") },
    { l: "Projects nominated", v: `${projectCount} of 14` },
    { l: "President", v: data.president.name || "—" },
    { l: "Secretary", v: data.secretary.name || "—" },
    { l: "Star nominees", v: data.starNominees.map((n) => n.name).filter(Boolean).join(", ") || "—" },
    { l: "Favorite DOs", v: data.favoriteDONominees.map((n) => n.name).filter(Boolean).join(", ") || "—" },
  ];
  return (
    <div className="glass rounded-2xl p-6">
      <div className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73]">Quick review</div>
      <div className="mt-3 divide-y divide-[rgba(214,186,115,0.12)]">
        {rows.map((r) => (
          <div key={r.l} className="grid sm:grid-cols-[160px_1fr] gap-2 py-2.5 text-sm">
            <div className="text-[rgba(244,234,213,0.55)]">{r.l}</div>
            <div className="text-[rgba(244,234,213,0.92)] break-words">{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Terminal screens
   ========================================================= */

function IneligibilityCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="relative glass-strong rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60%] h-72 bg-[radial-gradient(circle,rgba(246,184,163,0.4),transparent_60%)] blur-3xl" />
      <div className="relative">
        <div className="mx-auto w-20 h-20 rounded-full grid place-items-center bg-[rgba(246,184,163,0.1)] border border-[rgba(246,184,163,0.5)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 8v5M12 17h.01"
              stroke="#f6b8a3"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="9" stroke="#f6b8a3" strokeWidth="1.6" />
          </svg>
        </div>
        <div className="chip mt-6 mx-auto" style={{ borderColor: "rgba(246,184,163,0.5)", color: "#f6b8a3", background: "rgba(246,184,163,0.06)" }}>
          Ineligibility Notice
        </div>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">
          <span className="text-[rgba(244,234,213,0.92)]">We can't accept this</span>{" "}
          <span className="gold-text">nomination yet.</span>
        </h2>
        <p className="mt-4 text-[rgba(244,234,213,0.7)] max-w-xl mx-auto text-sm leading-relaxed">
          The Awards Committee requires every club to have paid RI &amp; District dues for 2025-26 —
          and community-based clubs to hold an active bank account. Please clear these gates with
          the District Office and return to this form.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onReset} className="btn-gold px-7 py-2.5 rounded-full text-sm font-semibold">
            Edit my answers
          </button>
          <a href="/" className="btn-ghost px-7 py-2.5 rounded-full text-sm">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

function ThankYouCard({ id, onRestart }: { id: string; onRestart: () => void }) {
  return (
    <div className="relative glass-strong rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60%] h-72 star-burst blur-3xl opacity-70" />
      <div className="relative">
        <div className="mx-auto w-20 h-20 rounded-full grid place-items-center bg-[rgba(214,186,115,0.12)] border border-[rgba(214,186,115,0.5)] ring-gold">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l4 4L19 7"
              stroke="#d6ba73"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="chip mt-6 mx-auto">Nomination received</div>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">
          <span className="gold-text">A story worth standing for.</span>
        </h2>
        <p className="mt-4 text-[rgba(244,234,213,0.7)] max-w-md mx-auto text-sm leading-relaxed">
          Your nomination is in the jury's hands. We've saved it under reference{" "}
          <span className="text-[#e8d49a] font-semibold">{id}</span>. We don't reveal names,
          clubs or numbers — only the count moves on the public site.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onRestart} className="btn-gold px-7 py-2.5 rounded-full text-sm font-semibold">
            Start another nomination
          </button>
          <a href="/" className="btn-ghost px-7 py-2.5 rounded-full text-sm">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
