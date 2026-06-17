type IconProps = { name: string; className?: string };

export default function AwardIcon({ name, className }: IconProps) {
  const stroke = "#d6ba73";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className || "w-6 h-6",
  };

  switch (name) {
    case "trophy":
      return (
        <svg {...common}>
          <path d="M7 3h10l-.7 6a4.3 4.3 0 0 1-8.6 0L7 3Z" />
          <path d="M5 5H3v2a3 3 0 0 0 3 3" />
          <path d="M19 5h2v2a3 3 0 0 1-3 3" />
          <path d="M10 14v3H9v2h6v-2h-1v-3" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="M3 17l2-9 4 4 3-6 3 6 4-4 2 9z" />
          <path d="M3 20h18" />
        </svg>
      );
    case "medal":
      return (
        <svg {...common}>
          <path d="M7 3l3 6M17 3l-3 6" />
          <circle cx="12" cy="15" r="6" />
          <path d="M9.5 14.5l2 2 3-3.5" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <path d="M3 12l4-4 3 2 4-4 4 4 3-1" />
          <path d="M3 12l4 4 3-2" />
          <path d="M14 14l3 3" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-2 5-5 2 2-5 5-2z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 3l2.5 6.5L21 11l-5 4.5L17.5 22 12 18l-5.5 4L8 15.5 3 11l6.5-1.5L12 3z" />
        </svg>
      );
    case "scroll":
      return (
        <svg {...common}>
          <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 1-1.7" />
          <path d="M9 8h8M9 12h8M9 16h5" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <path d="M6 3h12l3 5-9 13L3 8l3-5z" />
          <path d="M3 8h18M9 3l3 5 3-5M12 8l-3 13M12 8l3 13" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7l2-3h4l2 3" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
