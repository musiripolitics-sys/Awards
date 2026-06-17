"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/#categories", label: "Categories" },
  { href: "/#process", label: "Process" },
  { href: "/admin", label: "Admin" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-[rgba(5,6,10,0.7)] border-b border-[rgba(214,186,115,0.18)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(214,186,115,0.5)] bg-[rgba(214,186,115,0.08)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path
                d="M6 3h12l-1 6a5 5 0 0 1-10 0L6 3Z"
                stroke="#d6ba73"
                strokeWidth="1.4"
              />
              <path d="M9 14v3H8v2h8v-2h-1v-3" stroke="#d6ba73" strokeWidth="1.4" />
              <circle cx="12" cy="8" r="1.2" fill="#d6ba73" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[rgba(244,234,213,0.6)]">
              Rotaract District
            </div>
            <div className="font-display text-xl gold-text">Awards 2026</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-4 py-2 text-sm text-[rgba(244,234,213,0.75)] hover:text-[#f4ead5] transition-colors rounded-full hover:bg-[rgba(214,186,115,0.06)]"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/nominate"
            className="ml-2 btn-gold px-5 py-2.5 rounded-full text-sm font-semibold"
          >
            Nominate
          </Link>
        </nav>

        <button
          aria-label="Toggle menu"
          className="md:hidden w-10 h-10 grid place-items-center rounded-full gold-border"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block w-4 h-3">
            <span
              className={`absolute left-0 right-0 h-px bg-[#e8d49a] transition-all ${
                open ? "top-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 right-0 h-px bg-[#e8d49a] top-1/2 transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 right-0 h-px bg-[#e8d49a] transition-all ${
                open ? "top-1/2 -rotate-45" : "top-full"
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="md:hidden px-5 pb-5 pt-1 border-b border-[rgba(214,186,115,0.18)] bg-[rgba(5,6,10,0.95)]">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm text-[rgba(244,234,213,0.85)] hover:bg-[rgba(214,186,115,0.08)]"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/nominate"
              onClick={() => setOpen(false)}
              className="mt-2 btn-gold px-5 py-3 rounded-xl text-sm font-semibold text-center"
            >
              Submit Nomination
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
