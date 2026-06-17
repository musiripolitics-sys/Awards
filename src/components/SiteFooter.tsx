import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="relative mt-32 pb-10">
      <div className="gold-divider mb-12" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl gold-text mb-3">
            Rotaract District Awards
          </div>
          <p className="text-sm text-[rgba(244,234,213,0.6)] max-w-md leading-relaxed">
            A celebration of leadership, fellowship and service above self. Every nomination is a story worth telling.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="chip">RY 2025-26</span>
            <span className="chip">Rotaract</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.5)] mb-4">
            Explore
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#categories" className="hover:text-[#e8d49a]">Categories</Link></li>
            <li><Link href="/#process" className="hover:text-[#e8d49a]">Nomination Process</Link></li>
            <li><Link href="/winners" className="hover:text-[#e8d49a]">Hall of Honour</Link></li>
            <li><Link href="/nominate" className="hover:text-[#e8d49a]">Submit Nomination</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[rgba(244,234,213,0.5)] mb-4">
            District Office
          </div>
          <ul className="space-y-2 text-sm text-[rgba(244,234,213,0.7)]">
            <li>awards@rotaractdistrict.org</li>
            <li>Submissions close 30 Sep 2026</li>
            <li>Ceremony · 12 Nov 2026</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 mt-12 pt-6 border-t border-[rgba(214,186,115,0.14)] text-xs text-[rgba(244,234,213,0.4)] flex flex-col md:flex-row justify-between gap-2">
        <span>© 2026 Rotaract District. Service Above Self.</span>
        <span>Designed for the ones who quietly change the world.</span>
      </div>
    </footer>
  );
}
