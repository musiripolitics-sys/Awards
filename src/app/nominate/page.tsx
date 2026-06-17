import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ParticleField from "@/components/ParticleField";
import NominationForm from "./NominationForm";

export const metadata = {
  title: "Submit a Nomination | Rotaract District Awards",
};

export default function NominatePage() {
  return (
    <>
      <SiteHeader />
      <main className="relative">
        <section className="relative spotlight pt-12 pb-10 overflow-hidden">
          <ParticleField count={14} />
          <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8 text-center">
            <div className="chip mb-6 mx-auto">RID 3233 · Rotaract Awards 2025-26</div>
            <h1 className="font-display text-4xl sm:text-6xl leading-[1.05]">
              <span className="text-[rgba(244,234,213,0.92)]">Club login &amp; the</span>{" "}
              <span className="gold-text">full nomination flow.</span>
            </h1>
            <p className="mt-5 text-[15px] text-[rgba(244,234,213,0.7)] max-w-2xl mx-auto">
              Self-identify your club, clear the eligibility gate, and walk every section the
              district expects — project nominations, club performance, officer self-evaluation
              and member recognition. Auto-saved as you go.
            </p>
          </div>
        </section>

        <section className="relative pb-32">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <NominationForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
