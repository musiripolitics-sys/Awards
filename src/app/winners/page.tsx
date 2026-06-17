import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ParticleField from "@/components/ParticleField";
import WinnersGrid from "./WinnersGrid";

export const metadata = {
  title: "Hall of Honour · Rotaract District Awards",
};

export default function WinnersPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative">
        <section className="relative spotlight pt-16 pb-12 overflow-hidden">
          <ParticleField count={22} />
          <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 text-center">
            <div className="chip mx-auto mb-6">Hall of Honour</div>
            <h1 className="font-display text-[44px] sm:text-[72px] leading-[1.02]">
              <span className="text-[rgba(244,234,213,0.92)]">The names that</span>{" "}
              <span className="gold-text">define our district.</span>
            </h1>
            <p className="mt-6 text-[15px] text-[rgba(244,234,213,0.7)] max-w-xl mx-auto">
              A living archive of the projects, presidents and clubs that walked away with the
              gold. Filter by year, by category, or just by curiosity.
            </p>
          </div>
        </section>

        <WinnersGrid />
      </main>
      <SiteFooter />
    </>
  );
}
