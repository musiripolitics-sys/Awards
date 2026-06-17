"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NominationCounter({ compact = false }: { compact?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      let real = 0;
      try {
        const { count: dbCount, error } = await supabase
          .from("submissions")
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        real = dbCount || 0;
      } catch (err) {
        console.error("Error fetching submission count from Supabase:", err);
      }
      // Baseline reflects the district's published tally — we only ever expose a number.
      const baseline = 0;
      setCount(baseline + real);
    }

    fetchCount();
  }, []);

  useEffect(() => {
    if (count === null) return;
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.floor(eased * (count as number)));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  if (compact) {
    return (
      <div>
        <div className="font-display text-7xl gold-text">{shown.toLocaleString()}</div>
        <div className="text-xs uppercase tracking-[0.25em] text-[rgba(244,234,213,0.6)] mt-2">
          Nominations received
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 text-center relative overflow-hidden">
      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-[#d6ba73] to-transparent" />
      <div className="font-display text-4xl sm:text-5xl gold-text">
        {shown.toLocaleString()}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[rgba(244,234,213,0.55)]">
        Nominations received
      </div>
    </div>
  );
}
