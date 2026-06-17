import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdminDashboard from "./AdminDashboard";

export const metadata = {
  title: "Admin Review · Rotaract District Awards",
};

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="relative pt-10 pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#d6ba73]">
                Awards Committee
              </div>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl">
                <span className="text-[rgba(244,234,213,0.92)]">Review</span>{" "}
                <span className="gold-text">Console</span>
              </h1>
              <p className="mt-2 text-sm text-[rgba(244,234,213,0.6)] max-w-xl">
                Every nomination lands here. Score it, shortlist it, send it to the jury.
              </p>
            </div>
          </div>

          <AdminDashboard />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
