import type { CSSProperties } from "react";

const wrapper: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  zIndex: -1,
  overflow: "hidden",
};

function Trophy({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg
      width={size}
      height={(size * 72) / 64}
      viewBox="0 0 64 72"
      fill="none"
      style={{ opacity }}
    >
      <path
        d="M16 8 H48 V36 C48 48 16 48 16 36 Z"
        stroke="var(--ink)"
        strokeWidth="2.5"
        fill="var(--gold)"
        fillOpacity="0.4"
        strokeLinejoin="round"
      />
      <path
        d="M16 16 C8 16 8 28 16 28"
        stroke="var(--ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 16 C56 16 56 28 48 28"
        stroke="var(--ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="48"
        x2="32"
        y2="60"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect
        x="20"
        y="60"
        width="24"
        height="5"
        rx="2"
        stroke="var(--ink)"
        strokeWidth="2"
        fill="var(--gold)"
        fillOpacity="0.5"
      />
      <path
        d="M32 18 L33.5 23 L38.5 23 L34.5 26 L36 31 L32 28 L28 31 L29.5 26 L25.5 23 L30.5 23 Z"
        fill="var(--gold)"
        stroke="var(--ink)"
        strokeWidth="1"
      />
    </svg>
  );
}

function Medal({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg
      width={size}
      height={(size * 54) / 44}
      viewBox="0 0 44 54"
      fill="none"
      style={{ opacity }}
    >
      <line
        x1="16"
        y1="2"
        x2="12"
        y2="18"
        stroke="var(--gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="2"
        x2="32"
        y2="18"
        stroke="var(--gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="22"
        cy="34"
        r="16"
        fill="var(--gold)"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <circle
        cx="22"
        cy="34"
        r="11"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.5"
        opacity="0.3"
      />
    </svg>
  );
}

function Runner({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg
      width={size}
      height={(size * 28) / 18}
      viewBox="0 0 18 28"
      fill="none"
      style={{ opacity }}
    >
      <circle
        cx="9"
        cy="4"
        r="3"
        stroke="var(--ink)"
        strokeWidth="1.5"
        fill="rgba(93,199,122,0.5)"
      />
      <path
        d="M9 7 L9 16"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 10 L5 13"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 10 L13 8"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16 L6 22"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16 L13 20"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Deterministic PRNG keeps the parade stable across renders.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const parade = (() => {
  const rng = mulberry32(7);
  const items: { x: number; y: number; kind: "trophy" | "medal" | "runner" }[] =
    [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 12; col++) {
      const offset = (row % 2) * 7;
      items.push({
        x: col * 9 + offset + rng() * 1.5,
        y: row * 14 + rng() * 1.5,
        kind: (["trophy", "medal", "runner"] as const)[(row + col) % 3],
      });
    }
  }
  return items;
})();

export function AppBackground() {
  return (
    <div style={wrapper} aria-hidden>
      <div
        style={{
          position: "absolute",
          inset: "-10%",
          transform: "rotate(-8deg)",
          transformOrigin: "center",
        }}
      >
        {parade.map((p, i) => (
          <div
            key={i}
            style={{ position: "absolute", top: `${p.y}%`, left: `${p.x}%` }}
          >
            {p.kind === "trophy" && <Trophy size={40} opacity={0.08} />}
            {p.kind === "medal" && <Medal size={32} opacity={0.09} />}
            {p.kind === "runner" && <Runner size={26} opacity={0.11} />}
          </div>
        ))}
      </div>
    </div>
  );
}
