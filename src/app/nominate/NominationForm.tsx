"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

// ─── Google Apps Script upload proxy ─────────────────────────────────────────
// Runs as the Google account that deployed it — no service-account quota issues.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzWxR2GsZfRzQNYZs4KsLUAX41luOZluGa-K-GQw89xMevywIA468-nr-0lZPsDivEK/exec";

/** Convert a File to a raw base64 string (no data-URL prefix). */
function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (err) => reject(err);
  });
}

/* ---------------- Form state types ---------------- */

type YesNo = "yes" | "no" | "";

type ProjectEntry = {
  nominate: boolean;
  name: string;
  coHostClubs: string;
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

type OfficerNominee = { name: string; clubName: string };

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
  professionalImage: string;
  challengeThisYear: string;
  top3DO: [string, string, string];
  top3Presidents: [OfficerNominee, OfficerNominee, OfficerNominee];
  top3Secretaries: [OfficerNominee, OfficerNominee, OfficerNominee];
};

type StarNominee = { name: string; eval: string };

type FormState = {
  // Section 1 — Club Identity
  clubName: string;
  parentClub: string;
  clubNumber: string;
  clubType: "college" | "community" | "";
  clubLogo: string;

  // Section 2/3 — Eligibility
  riDuesPaid: YesNo;
  riDuesProof: string;
  districtDuesPaid: YesNo;
  districtDuesProof: string;
  bankAccountActive: YesNo;
  bankProofName: string;
  accountCreatedMailProof: string;
  colourGalataHosted: YesNo;
  colourGalataContribution: string;
  colourGalataReason: string;

  // Sections 4-17 — Projects
  projects: Record<ProjectKey, ProjectEntry>;

  // Section 18 — Club Award
  clubSelfEval: string;
  clubEvents: string[];
  clubEventCounts: Record<string, string>;
  clubInitiatives: string[];
  clubRotary: string[];
  clubOtherRIDE: string;
  clubOtherEvents: string;
  drcMeetingsAttended: string;
  closedDoorMeetingsAttended: string;
  drcMeetingsHosted: string;
  clubTRFContribution: string;
  districtEventsHostedByClub: string;
  twinClubAgreement: YesNo;
  twinClubAgreementProof: string;
  districtOfficialsFromClub: string;
  collaredMeetings: string;
  clubPhotosLink: string;

  // Section 19 — Social Media
  socialMediaDesc: string;
  socialMediaLinks: string;

  // Section 20 — Best Practice
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

  // Section 25 — Declaration
  declarationName: string;
  declarationRole: string;
  declarationDate: string;
  declared: boolean;
  consentContact: boolean;
};

const EMPTY_PROJECT: ProjectEntry = {
  nominate: false,
  name: "",
  coHostClubs: "",
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

const EMPTY_OFFICER_NOMINEE: OfficerNominee = { name: "", clubName: "" };

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
  professionalImage: "",
  challengeThisYear: "",
  top3DO: ["", "", ""],
  top3Presidents: [
    { ...EMPTY_OFFICER_NOMINEE },
    { ...EMPTY_OFFICER_NOMINEE },
    { ...EMPTY_OFFICER_NOMINEE },
  ],
  top3Secretaries: [
    { ...EMPTY_OFFICER_NOMINEE },
    { ...EMPTY_OFFICER_NOMINEE },
    { ...EMPTY_OFFICER_NOMINEE },
  ],
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
  clubLogo: "",

  riDuesPaid: "",
  riDuesProof: "",
  districtDuesPaid: "",
  districtDuesProof: "",
  bankAccountActive: "",
  bankProofName: "",
  accountCreatedMailProof: "",
  colourGalataHosted: "",
  colourGalataContribution: "",
  colourGalataReason: "",

  projects: emptyProjects(),

  clubSelfEval: "",
  clubEvents: [],
  clubEventCounts: {},
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
  twinClubAgreementProof: "",
  districtOfficialsFromClub: "",
  collaredMeetings: "",
  clubPhotosLink: "",

  socialMediaDesc: "",
  socialMediaLinks: "",

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

  declarationName: "",
  declarationRole: "",
  declarationDate: "",
  declared: false,
  consentContact: false,
};

const STORAGE_KEY = "rotaract-nomination-draft";

type TerminalState = null | "thank-you" | "ineligible";

const CATEGORY_STEP_MAP: Record<string, string> = {
  "best-club-service-project": "project:club-service-1",
  "best-professional-service-project": "project:professional-1",
  "best-community-service-project": "project:community-1",
  "best-international-service-project": "project:international-1",
  "best-ongoing-project": "project:ongoing",
  "best-legacy-project": "project:legacy",
  "best-joint-project": "project:joint",
  "best-multi-avenue-project": "project:multi-avenue",
  "best-public-image-project": "project:public-image",
  "best-innovative-project": "project:innovative",
  "best-rotaract-club": "club-award",
  "best-social-media": "social-media",
  "best-practice-award": "best-practice",
  "president-of-the-year": "president",
  "secretary-of-the-year": "secretary",
  "star-of-rotaract": "star-of-rotaract"
};

export default function NominationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category");
  const isSingleSectionMode = !!categoryParam;

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [terminal, setTerminal] = useState<TerminalState>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loggedInClub, setLoggedInClub] = useState<{ username: string; clubName: string } | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [dbRecordId, setDbRecordId] = useState<string | null>(null);
  const [dbSubmittedAt, setDbSubmittedAt] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Hydrate
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    async function initSession() {
      try {
        const session = sessionStorage.getItem("rotaract-club-session");
        let sessionClub = null;
        if (session) {
          const parsedSession = JSON.parse(session);
          sessionClub = parsedSession;
          
          // Fetch existing submission from Supabase
          const { data: existing, error } = await supabase
            .from("submissions")
            .select("*")
            .eq("submittedBy", parsedSession.username)
            .maybeSingle();
          if (existing) {
            setData(existing);
            setDbRecordId(existing.id);
            setDbSubmittedAt(existing.submittedAt);
            setDbStatus(existing.status);
            setEditMode(true);
            // Resume from last saved step
            if (typeof existing.lastStep === "number" && existing.lastStep > 0) {
              setStep(existing.lastStep);
            }
          } else {
            setData((d) => ({ ...d, clubName: parsedSession.clubName }));
          }
        }

        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const { __step, ...rest } = JSON.parse(raw);
          setData((d) => ({ ...d, ...rest, projects: { ...d.projects, ...(rest.projects || {}) } }));
          // Only use localStorage step if no DB step was restored
          if (typeof __step === "number") setStep((s) => (s === 0 ? __step : s));
        }

        if (sessionClub) {
          setLoggedInClub(sessionClub);
        }
      } catch (err) {
        console.error("Session initialization failed:", err);
      } finally {
        setHydrated(true);
      }
    }
    
    initSession();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const { data: club, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("username", loginUsername.trim().toLowerCase())
        .eq("password", loginPassword.trim())
        .single();

      if (error || !club) {
        throw new Error("Invalid username or password.");
      }

      const sessionObj = { username: club.username, clubName: club.clubName };
      
      // Fetch existing submission from Supabase first
      const { data: existing } = await supabase
        .from("submissions")
        .select("*")
        .eq("submittedBy", club.username)
        .maybeSingle();

      if (existing) {
        setData(existing);
        setDbRecordId(existing.id);
        setDbSubmittedAt(existing.submittedAt);
        setDbStatus(existing.status);
        setEditMode(true);
        // Resume from last saved step
        if (typeof existing.lastStep === "number" && existing.lastStep > 0) {
          setStep(existing.lastStep);
        }
      } else {
        setData((d) => ({ ...d, clubName: club.clubName }));
      }

      sessionStorage.setItem("rotaract-club-session", JSON.stringify(sessionObj));
      setLoggedInClub(sessionObj);
    } catch (err: any) {
      setLoginError(err.message || "Invalid username or password.");
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("rotaract-club-session");
    setLoggedInClub(null);
    setLoginUsername("");
    setLoginPassword("");
    setDbRecordId(null);
    setDbSubmittedAt(null);
    setDbStatus(null);
  }

  // Persist
  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || isSingleSectionMode) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, __step: step }));
    } catch {}
  }, [data, step, hydrated, isSingleSectionMode]);

  // Jump to specific category section if passed as search param
  useEffect(() => {
    if (!hydrated || !loggedInClub || !categoryParam) return;
    const targetStepId = CATEGORY_STEP_MAP[categoryParam];
    if (targetStepId) {
      const idx = FLOW.findIndex((s) => s.id === targetStepId);
      if (idx !== -1) {
        setStep(idx);
      }
    }
  }, [hydrated, loggedInClub, categoryParam]);

  async function handleSaveSingleSection() {
    setSubmitting(true);
    setSubmitError(null);

    const currentErrors = validateCurrent();
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) {
      setSubmitting(false);
      return;
    }

    const submissionId = dbRecordId || "RDA-" + Date.now().toString(36).toUpperCase();
    const { __step, ...cleanData } = data as any;
    const submission = {
      ...cleanData,
      id: submissionId,
      submittedAt: dbSubmittedAt || new Date().toISOString(),
      status: dbStatus || "pending",
      submittedBy: loggedInClub?.username || null,
      happyMomentDesc: "",
    };

    try {
      const { error } = await supabase.from("submissions").upsert([submission]);
      if (error) throw error;
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      setDbRecordId(submissionId);
      setDbSubmittedAt(submission.submittedAt);
      setDbStatus(submission.status);
      setSubmittedId(submissionId);
      setTerminal("thank-you");
    } catch (err: any) {
      console.error("Error saving section nomination:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
      if (!data.clubLogo.trim()) e.clubLogo = "Please upload your club logo (PNG).";
    }
    if (id === "docs") {
      if (!data.riDuesPaid) e.riDuesPaid = "Required.";
      if (data.riDuesPaid === "yes" && !data.riDuesProof.trim())
        e.riDuesProof = "Please upload the RI dues payment proof.";
      if (!data.districtDuesPaid) e.districtDuesPaid = "Required.";
      if (data.districtDuesPaid === "yes" && !data.districtDuesProof.trim())
        e.districtDuesProof = "Please upload the District dues payment proof.";
      if (data.clubType === "community") {
        if (!data.bankAccountActive) e.bankAccountActive = "Required.";
        if (data.bankAccountActive === "yes" && !data.bankProofName.trim())
          e.bankProofName = "Upload the bank account proof.";
        if (!data.colourGalataHosted) e.colourGalataHosted = "Required.";
        if (data.colourGalataHosted === "yes" && !data.colourGalataContribution.trim())
          e.colourGalataContribution = "Please mention how much your club contributed.";
        if (data.colourGalataHosted === "no" && !data.colourGalataReason.trim())
          e.colourGalataReason = "Please provide the reason for not participating.";
      }
    }
    if (id.startsWith("project:")) {
      const key = id.split(":")[1] as ProjectKey;
      const p = data.projects[key];
      if (p.nominate) {
        if (!p.name.trim()) e.projectName = "Project name is required.";
        if (key === "joint" && !p.coHostClubs.trim()) e.coHostClubs = "List at least one co-host club.";
        const PRIMARY_PROJECT_KEYS: ProjectKey[] = ["club-service-1", "professional-1", "community-1", "international-1"];
        const DATE_CUTOFF = "2025-12-07";
        if (!p.startDate) {
          e.startDate = "Start date is required.";
        } else if (PRIMARY_PROJECT_KEYS.includes(key) && p.startDate < DATE_CUTOFF) {
          e.startDate = "This project must have been conducted after 7 December 2025.";
        }
        if (!p.endDate) {
          e.endDate = "End date is required.";
        } else if (PRIMARY_PROJECT_KEYS.includes(key) && p.endDate < DATE_CUTOFF) {
          e.endDate = "This project must have ended on or after 7 December 2025.";
        }
        if (!p.beneficiaries.trim()) e.beneficiaries = "Required.";
        if (!p.purpose.trim()) e.purpose = "Required.";
        if (!p.overview.trim()) e.overview = "Required.";
        if (!p.highlights.trim()) e.highlights = "Required.";
        if (!p.picture1 || !p.picture2 || !p.picture3) e.pictures = "Attach all three pictures.";
      }
    }
    if (id === "club-award") {
      if (!data.clubSelfEval.trim()) e.clubSelfEval = "Required.";
      if (!data.drcMeetingsAttended) e.drcMeetingsAttended = "Required.";
      if (!data.closedDoorMeetingsAttended.trim()) e.closedDoorMeetingsAttended = "Required.";
      if (!data.clubTRFContribution.trim()) e.clubTRFContribution = "Required.";
      if (!data.twinClubAgreement) e.twinClubAgreement = "Required.";
      if (data.twinClubAgreement === "yes" && !data.twinClubAgreementProof.trim())
        e.twinClubAgreementProof = "Please upload the signed agreement (PDF).";
      if (!data.clubPhotosLink.trim()) e.clubPhotosLink = "Drive link is required.";
    }
    if (id === "social-media") {
      if (!data.socialMediaDesc.trim()) e.socialMediaDesc = "Required.";
      if (!data.socialMediaLinks.trim()) e.socialMediaLinks = "Required.";
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
      if (!o.challengeThisYear.trim()) e.challengeThisYear = "Required.";
      if (!o.drcMeetings.trim()) e.drcMeetings = "Required.";
      if (!o.closedDoorMeetings.trim()) e.closedDoorMeetings = "Required.";
      if (!o.trfContribution.trim()) e.trfContribution = "Required.";
      if (!o.photosLink.trim()) e.photosLink = "Drive link is required.";
      // All 3 District Official nominations are mandatory
      if (!o.top3DO[0].trim() || !o.top3DO[1].trim() || !o.top3DO[2].trim())
        e.top3DO = "All 3 District Official nominations are required.";
      // All 3 President nominations are mandatory
      const presidents = Array.isArray(o.top3Presidents) ? o.top3Presidents : [];
      if (presidents.length < 3 || presidents.some((n) => !n.name.trim() || !n.clubName.trim()))
        e.top3Presidents = "All 3 President nominations (name and club) are required.";
      // All 3 Secretary nominations are mandatory
      const secretaries = Array.isArray(o.top3Secretaries) ? o.top3Secretaries : [];
      if (secretaries.length < 3 || secretaries.some((n) => !n.name.trim() || !n.clubName.trim()))
        e.top3Secretaries = "All 3 Secretary nominations (name and club) are required.";
    }
    if (id === "star-of-rotaract") {
      data.starNominees.forEach((n, i) => {
        if (!n.name.trim()) e[`star-name-${i}`] = "Required.";
        if (!n.eval.trim()) e[`star-eval-${i}`] = "Required.";
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

  /** Upsert current form state to Supabase, recording which step we're on. */
  async function saveProgress(nextStep: number): Promise<void> {
    if (!loggedInClub) return; // not logged in — skip DB save
    try {
      const id = dbRecordId || "RDA-" + Date.now().toString(36).toUpperCase();
      const { __step, ...cleanData } = data as any;
      const payload = {
        ...cleanData,
        id,
        submittedAt: dbSubmittedAt || new Date().toISOString(),
        status: dbStatus || "pending",
        submittedBy: loggedInClub.username,
        lastStep: nextStep,
        happyMomentDesc: "",
      };
      const { error } = await supabase.from("submissions").upsert([payload]);
      if (error) {
        console.error(
          "[saveProgress] Supabase error:",
          error.message,
          "| code:", error.code,
          "| details:", error.details,
          "| hint:", error.hint,
        );
        throw error;
      }
      if (!dbRecordId)    setDbRecordId(id);
      if (!dbSubmittedAt) setDbSubmittedAt(payload.submittedAt);
      if (!dbStatus)      setDbStatus("pending");
    } catch (err: any) {
      console.error("[saveProgress] failed:", err?.message ?? err?.code ?? JSON.stringify(err));
    }
  }

  async function goNext() {
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

    // Save to DB before advancing
    setSubmitting(true);
    await saveProgress(step + 1);
    setSubmitting(false);

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
    const id = dbRecordId || "RDA-" + Date.now().toString(36).toUpperCase();
    
    const { __step, ...cleanData } = data as any;
    const submission = {
      ...cleanData,
      id,
      submittedAt: dbSubmittedAt || new Date().toISOString(),
      status: "pending",
      submittedBy: loggedInClub?.username || null,
      clubName: data.clubName,
      parentClub: data.parentClub,
      clubNumber: data.clubNumber,
      clubType: data.clubType,
      clubLogo: data.clubLogo || null,
      riDuesPaid: data.riDuesPaid,
      riDuesProof: data.riDuesProof || null,
      districtDuesPaid: data.districtDuesPaid,
      districtDuesProof: data.districtDuesProof || null,
      bankAccountActive: data.bankAccountActive || null,
      bankProofName: data.bankProofName || null,
      accountCreatedMailProof: data.accountCreatedMailProof || null,
      colourGalataHosted: data.colourGalataHosted || null,
      colourGalataContribution: data.colourGalataContribution || null,
      colourGalataReason: data.colourGalataReason || null,
      projects: data.projects,
      clubSelfEval: data.clubSelfEval,
      clubEvents: data.clubEvents,
      clubEventCounts: data.clubEventCounts,
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
      twinClubAgreementProof: data.twinClubAgreementProof || null,
      districtOfficialsFromClub: data.districtOfficialsFromClub || null,
      collaredMeetings: data.collaredMeetings || null,
      clubPhotosLink: data.clubPhotosLink,
      socialMediaDesc: data.socialMediaDesc,
      socialMediaLinks: data.socialMediaLinks,
      bestPracticeDesc: data.bestPracticeDesc,
      bestPracticePic1: data.bestPracticePic1 || null,
      bestPracticePic2: data.bestPracticePic2 || null,
      bestPracticePic3: data.bestPracticePic3 || null,
      president: data.president,
      secretary: data.secretary,
      starNominees: data.starNominees,
      declarationName: data.declarationName,
      declarationRole: data.declarationRole,
      declarationDate: data.declarationDate,
      declared: data.declared,
      consentContact: data.consentContact,
      happyMomentDesc: "",
    };

    try {
      const { error } = await supabase.from("submissions").upsert([submission]);
      if (error) {
        throw error;
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      setDbRecordId(id);
      setDbSubmittedAt(submission.submittedAt);
      setDbStatus(submission.status);
      setSubmittedId(id);
      setEditMode(true);
      setTerminal("thank-you");
    } catch (err: any) {
      console.error("Error submitting nomination to Supabase:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    if (isSingleSectionMode) {
      router.push("/");
      return;
    }
    setData({ ...EMPTY, clubName: loggedInClub?.clubName || "" });
    setStep(0);
    setErrors({});
    setTerminal(null);
    setSubmittedId(null);
    setEditMode(false);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }

  function enterEditMode() {
    setTerminal(null);
    setStep(0);
    setErrors({});
    setEditMode(true);
  }

  /* ---------- Terminal screens ---------- */
  if (terminal === "ineligible") {
    return <IneligibilityCard onReset={() => setTerminal(null)} />;
  }
  if (terminal === "thank-you") {
    return <ThankYouCard id={submittedId || "RDA-XXXX"} onRestart={restart} onEdit={enterEditMode} />;
  }

  if (!loggedInClub) {
    return (
      <div className="max-w-md mx-auto glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden grain">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80%] h-72 star-burst blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#d6ba73] mb-2">
            Club Authentication Gate
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-[rgba(244,234,213,0.95)]">
            District Awards 2025-26
          </h2>
          <p className="mt-2 text-sm text-[rgba(244,234,213,0.6)] leading-relaxed">
            Please log in with your secure club credentials to access the nomination flow. Only authorized clubs can submit.
          </p>
          
          <form onSubmit={handleLogin} className="mt-6 grid gap-4">
            <div>
              <label className="input-label">Username</label>
              <input
                className="input-field"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. mssw.rotaract"
                required
                disabled={loggingIn}
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input-field"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loggingIn}
              />
            </div>
            
            {loginError && (
              <div className="text-xs text-[#f6b8a3] mt-1 font-semibold">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loggingIn}
              className="btn-gold mt-2 px-6 py-3 rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Authenticate & Continue →"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ---------- Active form ---------- */
  return (
    <div className="glass-strong rounded-3xl overflow-hidden">
      <ProgressRail
        step={step}
        progress={progress}
        group={current.group}
        clubName={loggedInClub?.clubName || ""}
        onLogout={handleLogout}
        isSingleSectionMode={isSingleSectionMode}
      />

      {editMode && (
        <SectionNavigator
          currentStep={step}
          data={data}
          onJump={(s) => { setStep(s); setErrors({}); }}
        />
      )}

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
          {current.id === "declaration" && (
            <DeclarationSection data={data} update={update} errors={errors} />
          )}
        </div>

        {submitError && (
          <div className="mt-6 p-4 rounded-xl border border-[rgba(255,150,140,0.3)] bg-[rgba(255,150,140,0.06)] text-sm text-[#f6b8a3]">
            <strong>Submission failed:</strong> {submitError}
          </div>
        )}

        {isSingleSectionMode ? (
          <div className="mt-10 pt-6 border-t border-[rgba(214,186,115,0.16)] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.5)]">
              Single Section Edit Mode · Auto-saving disabled
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.push("/")}
                disabled={submitting}
                className="btn-ghost px-6 py-2.5 rounded-full text-sm disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSingleSection}
                disabled={submitting}
                className="btn-gold px-7 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        ) : (
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
                  className="btn-ghost px-6 py-2.5 rounded-full text-sm disabled:opacity-50 cursor-pointer"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="btn-gold px-7 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : step === FLOW.length - 1 ? (
                  "Submit Nomination ✓"
                ) : (
                  "Save & Continue →"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Section Navigator (edit mode)
   ========================================================= */

function SectionNavigator({
  currentStep,
  data,
  onJump,
}: {
  currentStep: number;
  data: FormState;
  onJump: (step: number) => void;
}) {
  const [open, setOpen] = useState(true);

  // Group FLOW entries by their group label
  const groups = useMemo(() => {
    const map = new Map<string, { step: number; id: string; title: string }[]>();
    FLOW.forEach((f, i) => {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group)!.push({ step: i, id: f.id, title: f.title });
    });
    return map;
  }, []);

  // Simple check: is there meaningful data for a given step?
  function hasData(id: string): boolean {
    if (id === "identity") return !!data.clubName.trim();
    if (id === "docs") return !!data.riDuesPaid;
    if (id.startsWith("project:")) {
      const key = id.split(":")[1] as ProjectKey;
      return !!data.projects[key]?.nominate;
    }
    if (id === "club-award") return !!data.clubSelfEval.trim();
    if (id === "social-media") return !!data.socialMediaDesc.trim();
    if (id === "best-practice") return !!data.bestPracticeDesc.trim();
    if (id === "president") return !!data.president.name.trim();
    if (id === "secretary") return !!data.secretary.name.trim();
    if (id === "star-of-rotaract") return !!data.starNominees[0].name.trim();
    if (id === "declaration") return !!data.declarationName.trim();
    return false;
  }

  return (
    <div className="border-b border-[rgba(214,186,115,0.18)] bg-[rgba(214,186,115,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d6ba73] animate-pulse-gold" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#d6ba73]">
            Edit Mode · Jump to any section
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          className={`transition-transform text-[#d6ba73] ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-5 grid gap-4">
          {Array.from(groups.entries()).map(([group, sections]) => (
            <div key={group}>
              <div className="text-[9px] uppercase tracking-[0.3em] text-[rgba(244,234,213,0.35)] mb-2">
                {group}
              </div>
              <div className="flex flex-wrap gap-2">
                {sections.map(({ step, id, title }) => {
                  const isCurrent = step === currentStep;
                  const done = hasData(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onJump(step)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border ${
                        isCurrent
                          ? "border-[#d6ba73] bg-[rgba(214,186,115,0.15)] text-[#f4ead5] font-semibold"
                          : "border-[rgba(214,186,115,0.2)] text-[rgba(244,234,213,0.65)] hover:border-[rgba(214,186,115,0.5)] hover:text-[#f4ead5]"
                      }`}
                    >
                      {done && !isCurrent && (
                        <span className="w-3 h-3 rounded-full bg-[rgba(214,186,115,0.3)] grid place-items-center shrink-0">
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12l4 4L19 7" stroke="#d6ba73" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d6ba73] shrink-0" />
                      )}
                      <span className="truncate max-w-[120px]">{title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Progress + heading
   ========================================================= */

function ProgressRail({ 
  step, 
  progress, 
  group, 
  clubName, 
  onLogout,
  isSingleSectionMode = false
}: { 
  step: number; 
  progress: number; 
  group: string; 
  clubName: string;
  onLogout: () => void;
  isSingleSectionMode?: boolean;
}) {
  return (
    <div className="relative bg-[rgba(10,13,24,0.6)] border-b border-[rgba(214,186,115,0.18)] px-6 sm:px-10 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.65)]">
          <span className="chip">{isSingleSectionMode ? "Category Nomination" : group}</span>
          {!isSingleSectionMode && <span>Section {step + 1} / {FLOW.length}</span>}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[rgba(244,234,213,0.5)] italic truncate max-w-[150px] sm:max-w-xs">{clubName}</span>
          <button 
            type="button" 
            onClick={onLogout} 
            className="text-[#f6b8a3] hover:text-[#ff968c] transition text-[10px] uppercase tracking-wider font-semibold border border-[rgba(255,150,140,0.3)] bg-[rgba(255,150,140,0.04)] px-2.5 py-1 rounded-full cursor-pointer"
          >
            Sign Out
          </button>
          {!isSingleSectionMode && <span className="text-[11px] uppercase tracking-[0.22em] text-[#d6ba73]">{progress}%</span>}
        </div>
      </div>
      {!isSingleSectionMode && (
        <div className="mt-3 h-px bg-[rgba(214,186,115,0.18)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#e8d49a] via-[#d6ba73] to-[#a8893e] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
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

function EventAttendanceList({
  options,
  value,
  counts,
  onChange,
  onCountChange,
}: {
  options: string[];
  value: string[];
  counts: Record<string, string>;
  onChange: (next: string[]) => void;
  onCountChange: (event: string, count: string) => void;
}) {
  function toggle(opt: string) {
    const has = value.includes(opt);
    onChange(has ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div className="grid gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <div
            key={opt}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              active
                ? "border-[#d6ba73] bg-[rgba(214,186,115,0.1)]"
                : "border-[rgba(214,186,115,0.18)] hover:border-[rgba(214,186,115,0.4)]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(opt)}
              className="flex items-center gap-3 flex-1 text-left min-w-0"
            >
              <span
                className={`w-4 h-4 rounded-sm border grid place-items-center shrink-0 ${
                  active ? "border-[#d6ba73] bg-[#d6ba73]" : "border-[rgba(214,186,115,0.5)]"
                }`}
              >
                {active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l4 4L19 7" stroke="#0a0d18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-sm truncate ${active ? "text-[#f4ead5]" : "text-[rgba(244,234,213,0.7)]"}`}>{opt}</span>
            </button>
            {active && (
              <label className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[rgba(244,234,213,0.5)] whitespace-nowrap">
                  Members attended
                </span>
                <input
                  type="number"
                  min="1"
                  className="input-field !w-20 !py-1.5 text-center"
                  value={counts[opt] ?? ""}
                  onChange={(e) => onCountChange(opt, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="0"
                />
              </label>
            )}
          </div>
        );
      })}
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
  subfolder,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  /** Optional Drive subfolder name to keep files organised (e.g. "logos", "dues", "projects") */
  subfolder?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const isUrl = !!value && (value.startsWith("https://") || value.startsWith("/uploads/"));
  const displayName = isUrl ? "✓ Uploaded" : (value || "");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const prefix = subfolder ? `${subfolder.toUpperCase()}_` : "";
      const filename = `${prefix}${Date.now()}_${file.name}`;

      const base64File = await getBase64(file);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ file: base64File, filename, mimeType: file.type }),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      });

      const result = await response.json();
      if (result.status !== "success") throw new Error(result.message || "Upload failed.");

      onChange(result.fileUrl as string);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label} hint={hint} error={error || uploadError || undefined} required={required}>
      <label className={`block ${uploading ? "pointer-events-none" : "cursor-pointer"}`}>
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={handleChange}
        />
        <div
          className={`input-field flex items-center justify-between gap-3 ${
            isUrl
              ? "border-[rgba(214,186,115,0.5)]"
              : value
                ? "border-[rgba(214,186,115,0.3)]"
                : ""
          }`}
        >
          <span
            className={`truncate text-sm ${
              isUrl || value ? "text-[#f4ead5]" : "text-[rgba(244,234,213,0.45)]"
            }`}
          >
            {uploading ? "Uploading…" : displayName || "Choose a file…"}
          </span>

          <span
            className={`shrink-0 text-[10px] uppercase tracking-[0.22em] ${
              uploading ? "text-[rgba(214,186,115,0.45)] animate-pulse" : "text-[#d6ba73]"
            }`}
          >
            {uploading ? "UPLOADING" : isUrl ? "CHANGE" : "UPLOAD"}
          </span>
        </div>
      </label>

      {/* View link when a Drive URL is stored */}
      {isUrl && !uploading && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[rgba(214,186,115,0.7)] hover:text-[#d6ba73] transition-colors"
        >
          View uploaded file ↗
        </a>
      )}
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
      <Field label="Club Name" hint="Your authenticated club name is locked for safety." error={errors.clubName} required>
        <input
          className="input-field opacity-75 cursor-not-allowed select-none bg-[rgba(214,186,115,0.04)] font-semibold"
          value={data.clubName}
          readOnly
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

      <div className="glass rounded-2xl p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73] mb-1">
          Club Logo
        </div>
        <p className="text-sm text-[rgba(244,234,213,0.6)] mb-4">
          Upload your club&apos;s official logo in PNG format. This will appear on your nomination
          certificate and award materials.
        </p>
        <div className="flex items-start gap-5 flex-wrap">
          {data.clubLogo && (
            <div className="w-20 h-20 rounded-xl border border-[rgba(214,186,115,0.3)] bg-[rgba(214,186,115,0.05)] grid place-items-center overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.clubLogo}
                alt="Club logo preview"
                className="w-full h-full object-contain p-1"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <FileField
              label="Upload Club Logo"
              value={data.clubLogo}
              onChange={(name) => update("clubLogo", name)}
              accept="image/png"
              hint="PNG only · transparent background recommended · max 4 MB"
              required
              error={errors.clubLogo}
              subfolder="logos"
            />
          </div>
        </div>
      </div>
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
      {data.riDuesPaid === "yes" && (
        <FileField
          label="Upload RI Dues payment proof"
          value={data.riDuesProof}
          onChange={(name) => update("riDuesProof", name)}
          accept="application/pdf,image/*"
          hint="Receipt or confirmation of RI dues payment (PDF or image, max 4 MB)."
          required
          error={errors.riDuesProof}
          subfolder="dues"
        />
      )}

      <Field label="District Dues paid for 2025-26" error={errors.districtDuesPaid} required>
        <YesNoToggle value={data.districtDuesPaid} onChange={(v) => update("districtDuesPaid", v)} />
      </Field>
      {data.districtDuesPaid === "yes" && (
        <FileField
          label="Upload District Dues payment proof"
          value={data.districtDuesProof}
          onChange={(name) => update("districtDuesProof", name)}
          accept="application/pdf,image/*"
          hint="Receipt or confirmation of District dues payment (PDF or image, max 4 MB)."
          required
          error={errors.districtDuesProof}
          subfolder="dues"
        />
      )}

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
              label="Upload Bank Account Proof"
              value={data.bankProofName}
              onChange={(name) => {
                update("bankProofName", name);
                update("accountCreatedMailProof", name);
              }}
              accept="application/pdf,image/*"
              hint="Latest bank statement, bank letter, or account opening confirmation mail (PDF or image, max 4 MB)."
              required
              error={errors.bankProofName}
              subfolder="dues"
            />
          )}

          {/* ── Colour Galata ── */}
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73] mb-1">
              Colour Galata — District Initiative
            </div>
            <p className="text-sm text-[rgba(244,234,213,0.6)] mb-4">
              Community-based clubs are expected to participate in the Colour Galata district initiative.
            </p>
            <Field
              label="Did your club host / participate in Colour Galata?"
              error={errors.colourGalataHosted}
              required
            >
              <YesNoToggle
                value={data.colourGalataHosted}
                onChange={(v) => update("colourGalataHosted", v)}
              />
            </Field>
            {data.colourGalataHosted === "yes" && (
              <div className="mt-4">
                <Field
                  label="How much did your club contribute?"
                  error={errors.colourGalataContribution}
                  hint="Amount raised / number of volunteers / scope of involvement — be specific."
                  required
                >
                  <textarea
                    className="input-field min-h-[90px]"
                    value={data.colourGalataContribution}
                    onChange={(e) => update("colourGalataContribution", e.target.value)}
                    placeholder="e.g. ₹15,000 raised · 30 volunteers · managed 2 stalls"
                  />
                </Field>
              </div>
            )}
            {data.colourGalataHosted === "no" && (
              <div className="mt-4">
                <Field
                  label="Why did your club not participate?"
                  error={errors.colourGalataReason}
                  hint="Be honest — the jury values transparency."
                  required
                >
                  <textarea
                    className="input-field min-h-[90px]"
                    value={data.colourGalataReason}
                    onChange={(e) => update("colourGalataReason", e.target.value)}
                    placeholder="Describe the circumstances that prevented participation."
                  />
                </Field>
              </div>
            )}
          </div>
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
  console.log("DEBUG PROJECT SECTION:", projectKey, "nominate:", project?.nominate, "typeof project:", typeof project, "project keys:", Object.keys(project || {}), "name:", project?.name);
  return (
    <div className="grid gap-5">
      <div className="glass rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73]">
            {meta.avenue} avenue
          </div>
          <div className="mt-1 font-display text-2xl text-[#f4ead5]">{meta.title}</div>
          <p className="mt-1 text-sm text-[rgba(244,234,213,0.65)] max-w-xl">{meta.description}</p>
          {meta.note && (
            <div
              className={`mt-3 flex items-start gap-2 px-4 py-3 rounded-xl text-sm leading-snug ${
                meta.noteType === "warning"
                  ? "bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.3)] text-[#fde68a]"
                  : "bg-[rgba(214,186,115,0.07)] border border-[rgba(214,186,115,0.25)] text-[rgba(244,234,213,0.75)]"
              }`}
            >
              {meta.noteType === "warning" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-[#fbbf24]">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-[#d6ba73]">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              <span>{meta.note}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 cursor-pointer text-sm shrink-0">
          <span className="text-[rgba(244,234,213,0.7)]">Nominate in this category</span>
          <span
            onClick={(e) => {
              console.log("SWITCH CLICKED! projectKey:", projectKey, "current nominate:", project.nominate);
              e.stopPropagation();
              updateProject(projectKey, { nominate: !project.nominate });
            }}
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
        </div>
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

          {projectKey === "joint" && (
            <Field
              label="Co-host Club(s)"
              error={errors.coHostClubs}
              hint="Name every club this project was done in partnership with — one per line."
              required
            >
              <textarea
                className="input-field min-h-[90px]"
                value={project.coHostClubs}
                onChange={(e) => updateProject(projectKey, { coHostClubs: e.target.value })}
                placeholder={"Rotaract Club of …\nRotaract Club of …"}
              />
            </Field>
          )}

          {(() => {
            const PRIMARY_KEYS: ProjectKey[] = ["club-service-1", "professional-1", "community-1", "international-1"];
            const dateMin = PRIMARY_KEYS.includes(projectKey) ? "2025-12-07" : undefined;
            return (
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Project Start Date" error={errors.startDate} required>
                  <input
                    type="date"
                    className="input-field"
                    value={project.startDate}
                    min={dateMin}
                    onChange={(e) => updateProject(projectKey, { startDate: e.target.value })}
                  />
                </Field>
                <Field label="Project End Date" error={errors.endDate} required>
                  <input
                    type="date"
                    className="input-field"
                    value={project.endDate}
                    min={dateMin}
                    onChange={(e) => updateProject(projectKey, { endDate: e.target.value })}
                  />
                </Field>
              </div>
            );
          })()}
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
                subfolder="projects"
              />
              <FileField
                label="Picture 2"
                value={project.picture2}
                onChange={(n) => updateProject(projectKey, { picture2: n })}
                subfolder="projects"
              />
              <FileField
                label="Picture 3"
                value={project.picture3}
                onChange={(n) => updateProject(projectKey, { picture3: n })}
                subfolder="projects"
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

      <Field
        label="District Events Participated"
        hint="Check each event your club attended and enter how many members were present."
        required
      >
        <EventAttendanceList
          options={DISTRICT_EVENTS_CLUB}
          value={data.clubEvents}
          counts={data.clubEventCounts}
          onChange={(v) => update("clubEvents", v)}
          onCountChange={(evt, cnt) =>
            update("clubEventCounts", { ...data.clubEventCounts, [evt]: cnt })
          }
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
          hint="Maximum 10."
          required
        >
          <select
            className="input-field"
            value={data.drcMeetingsAttended}
            onChange={(e) => update("drcMeetingsAttended", e.target.value)}
          >
            <option value="">Select…</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
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
        <Field label="Twin / Sister Club agreement for 2025-26" error={errors.twinClubAgreement} required>
          <YesNoToggle value={data.twinClubAgreement} onChange={(v) => update("twinClubAgreement", v)} />
        </Field>
        {data.twinClubAgreement === "yes" && (
          <FileField
            label="Upload signed Twin / Sister Club agreement (PDF)"
            value={data.twinClubAgreementProof}
            onChange={(name) => update("twinClubAgreementProof", name)}
            accept="application/pdf"
            hint="The signed agreement document exported as PDF (max 4 MB)."
            required
            error={errors.twinClubAgreementProof}
            subfolder="agreements"
          />
        )}
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
   Section 20 — Best Practice
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
            subfolder="best-practice"
          />
          <FileField
            label="Picture 2"
            value={data.bestPracticePic2}
            onChange={(n) => update("bestPracticePic2", n)}
            subfolder="best-practice"
          />
          <FileField
            label="Picture 3"
            value={data.bestPracticePic3}
            onChange={(n) => update("bestPracticePic3", n)}
            subfolder="best-practice"
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

  // Guard against old Supabase records that pre-date these fields
  const emptyNominee: OfficerNominee = { name: "", clubName: "" };
  const top3Presidents: [OfficerNominee, OfficerNominee, OfficerNominee] =
    Array.isArray(data.top3Presidents) && data.top3Presidents.length === 3
      ? data.top3Presidents
      : [{ ...emptyNominee }, { ...emptyNominee }, { ...emptyNominee }];
  const top3Secretaries: [OfficerNominee, OfficerNominee, OfficerNominee] =
    Array.isArray(data.top3Secretaries) && data.top3Secretaries.length === 3
      ? data.top3Secretaries
      : [{ ...emptyNominee }, { ...emptyNominee }, { ...emptyNominee }];

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

      <FileField
        label={`${isPresident ? "President" : "Secretary"}'s Professional Photo`}
        value={data.professionalImage}
        onChange={(n) => update({ professionalImage: n })}
        accept="image/*"
        hint="A clear headshot or professional portrait (JPG/PNG, max 4 MB). Optional but recommended."
        subfolder="officers"
      />

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

      <Field
        label={`Biggest Challenge You Faced This Year as ${isPresident ? "President" : "Secretary"}`}
        error={errors.challengeThisYear}
        hint="Within 150 words — be frank and specific."
        required
      >
        <textarea
          className="input-field min-h-[110px]"
          value={data.challengeThisYear}
          onChange={(e) => update({ challengeThisYear: e.target.value })}
          placeholder="Describe the hardest problem you navigated this year and how you handled it."
        />
        <WordCount text={data.challengeThisYear} max={150} />
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
          hint="Maximum 10."
          required
        >
          <select
            className="input-field"
            value={data.drcMeetings}
            onChange={(e) => update({ drcMeetings: e.target.value })}
          >
            <option value="">Select…</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
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

      {/* ── Supporting Photographs — placed ABOVE nomination blocks ── */}
      <Field
        label="Submission of Supporting Photographs"
        error={errors.photosLink}
        hint="Google Drive open-access link containing all supporting photos for this officer."
        required
      >
        <input
          className="input-field"
          value={data.photosLink}
          onChange={(e) => update({ photosLink: e.target.value })}
          placeholder="https://drive.google.com/…"
        />
      </Field>

      {/* ── Top 3 District Official Nominations (all mandatory) ── */}
      <div className="glass rounded-2xl p-5 grid gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73] mb-1">
            Top 3 District Official Nominations <span className="text-[#f6b8a3]">*</span>
          </div>
          <p className="text-sm text-[rgba(244,234,213,0.6)]">
            Nominate 3 District Officials you felt made the biggest impact this year. All 3 are required.
            <span className="block mt-1 text-[rgba(244,234,213,0.45)]">
              DRR, GRR and GRS are excluded. You may not nominate your own club&apos;s President or Secretary.
            </span>
          </p>
          {errors.top3DO && (
            <p className="mt-1 text-xs text-[#f6b8a3]">{errors.top3DO}</p>
          )}
        </div>
        {([0, 1, 2] as const).map((i) => (
          <Field key={i} label={`Nominee ${i + 1}`} required>
            <input
              className="input-field"
              value={data.top3DO[i]}
              onChange={(e) => {
                const next: [string, string, string] = [...data.top3DO] as [string, string, string];
                next[i] = e.target.value;
                update({ top3DO: next });
              }}
              placeholder="Rtr. Full Name · Role"
            />
          </Field>
        ))}
      </div>

      {/* ── Top 3 President Nominations (mandatory) ── */}
      <div className="glass rounded-2xl p-5 grid gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73] mb-1">
            Top 3 President Nominations <span className="text-[#f6b8a3]">*</span>
          </div>
          <p className="text-sm text-[rgba(244,234,213,0.6)]">
            Nominate 3 Presidents from other clubs whom you feel deserve recognition. All 3 are required.
          </p>
          {errors.top3Presidents && (
            <p className="mt-1 text-xs text-[#f6b8a3]">{errors.top3Presidents}</p>
          )}
        </div>
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-3 border border-[rgba(214,186,115,0.12)] rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.4)] col-span-full mb-1">
              Nominee {i + 1}
            </div>
            <Field label="Full Name" required>
              <input
                className="input-field"
                value={top3Presidents[i].name}
                onChange={(e) => {
                  const next = [...top3Presidents] as [OfficerNominee, OfficerNominee, OfficerNominee];
                  next[i] = { ...next[i], name: e.target.value };
                  update({ top3Presidents: next });
                }}
                placeholder="Rtr. Full Name"
              />
            </Field>
            <Field label="Club Name" required>
              <input
                className="input-field"
                value={top3Presidents[i].clubName}
                onChange={(e) => {
                  const next = [...top3Presidents] as [OfficerNominee, OfficerNominee, OfficerNominee];
                  next[i] = { ...next[i], clubName: e.target.value };
                  update({ top3Presidents: next });
                }}
                placeholder="RAC Club Name"
              />
            </Field>
          </div>
        ))}
      </div>

      {/* ── Top 3 Secretary Nominations (mandatory) ── */}
      <div className="glass rounded-2xl p-5 grid gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#d6ba73] mb-1">
            Top 3 Secretary Nominations <span className="text-[#f6b8a3]">*</span>
          </div>
          <p className="text-sm text-[rgba(244,234,213,0.6)]">
            Nominate 3 Secretaries from other clubs whom you feel deserve recognition. All 3 are required.
          </p>
          {errors.top3Secretaries && (
            <p className="mt-1 text-xs text-[#f6b8a3]">{errors.top3Secretaries}</p>
          )}
        </div>
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-3 border border-[rgba(214,186,115,0.12)] rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.4)] col-span-full mb-1">
              Nominee {i + 1}
            </div>
            <Field label="Full Name" required>
              <input
                className="input-field"
                value={top3Secretaries[i].name}
                onChange={(e) => {
                  const next = [...top3Secretaries] as [OfficerNominee, OfficerNominee, OfficerNominee];
                  next[i] = { ...next[i], name: e.target.value };
                  update({ top3Secretaries: next });
                }}
                placeholder="Rtr. Full Name"
              />
            </Field>
            <Field label="Club Name" required>
              <input
                className="input-field"
                value={top3Secretaries[i].clubName}
                onChange={(e) => {
                  const next = [...top3Secretaries] as [OfficerNominee, OfficerNominee, OfficerNominee];
                  next[i] = { ...next[i], clubName: e.target.value };
                  update({ top3Secretaries: next });
                }}
                placeholder="RAC Club Name"
              />
            </Field>
          </div>
        ))}
      </div>
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

function ThankYouCard({
  id,
  onRestart,
  onEdit,
}: {
  id: string;
  onRestart: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="relative glass-strong rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[60%] h-72 star-burst blur-3xl opacity-70" />
      <div className="relative">
        <div className="mx-auto w-20 h-20 rounded-full grid place-items-center bg-[rgba(214,186,115,0.12)] border border-[rgba(214,186,115,0.5)] ring-gold">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l4 4L19 7" stroke="#d6ba73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="chip mt-6 mx-auto">Nomination saved</div>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">
          <span className="gold-text">A story worth standing for.</span>
        </h2>
        <p className="mt-4 text-[rgba(244,234,213,0.7)] max-w-md mx-auto text-sm leading-relaxed">
          Your nomination is saved under reference{" "}
          <span className="text-[#e8d49a] font-semibold">{id}</span>. You can edit any section
          before the deadline. We don&apos;t reveal names, clubs or numbers — only the count moves on the
          public site.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onEdit}
            className="btn-gold px-7 py-2.5 rounded-full text-sm font-semibold"
          >
            ✏️ Edit my submission
          </button>
          <button onClick={onRestart} className="btn-ghost px-7 py-2.5 rounded-full text-sm">
            Start fresh
          </button>
          <a href="/" className="btn-ghost px-7 py-2.5 rounded-full text-sm">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
