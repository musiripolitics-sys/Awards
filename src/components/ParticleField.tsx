"use client";

import { useEffect, useState } from "react";

type Particle = {
  left: string;
  top: string;
  delay: string;
  duration: string;
  size: number;
  type: "dot" | "ring" | "star";
};

export default function ParticleField({ count = 24 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const p: Particle[] = Array.from({ length: count }).map(() => {
      const r = Math.random();
      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${6 + Math.random() * 10}s`,
        size: 2 + Math.random() * 5,
        type: r > 0.85 ? "star" : r > 0.55 ? "ring" : "dot",
      };
    });
    setParticles(p);
  }, [count]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute animate-float"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.type === "dot" && (
            <span
              className="block rounded-full"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background:
                  "radial-gradient(circle, rgba(244,234,213,0.95), rgba(214,186,115,0.4) 60%, transparent 80%)",
                filter: "blur(0.3px)",
              }}
            />
          )}
          {p.type === "ring" && (
            <span
              className="block rounded-full border"
              style={{
                width: `${p.size * 2}px`,
                height: `${p.size * 2}px`,
                borderColor: "rgba(214,186,115,0.45)",
              }}
            />
          )}
          {p.type === "star" && (
            <svg
              width={p.size * 3}
              height={p.size * 3}
              viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 0 6px rgba(214,186,115,0.6))" }}
            >
              <path
                d="M12 2l1.8 6.6L20 10l-5.4 3 1.6 6.4L12 16.8 7.8 19.4 9.4 13 4 10l6.2-1.4L12 2z"
                fill="rgba(244,234,213,0.85)"
              />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}
