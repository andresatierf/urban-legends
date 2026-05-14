export function TrophySvg() {
  return (
    <svg
      aria-hidden
      width="64"
      height="72"
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 8 H48 V36 C48 48 16 48 16 36 Z"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        fill="rgba(255,200,71,0.25)"
        strokeLinejoin="round"
      />
      <path
        d="M16 16 C8 16 8 28 16 28"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 16 C56 16 56 28 48 28"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="48"
        x2="32"
        y2="60"
        stroke="var(--fd-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect
        x="20"
        y="60"
        width="24"
        height="5"
        rx="2"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        fill="rgba(255,200,71,0.3)"
      />
      <path
        d="M32 18 L33.5 23 L38.5 23 L34.5 26 L36 31 L32 28 L28 31 L29.5 26 L25.5 23 L30.5 23 Z"
        fill="#ffc847"
        stroke="var(--fd-ink)"
        strokeWidth="1"
      />
    </svg>
  );
}

export function WhistleSvg() {
  return (
    <svg
      aria-hidden
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-[2px] flex-shrink-0"
    >
      <circle
        cx="9"
        cy="14"
        r="5"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        fill="rgba(255,122,69,0.15)"
      />
      <path
        d="M14 14 L20 8"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 6 L22 6"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="9"
        x2="9"
        y2="11"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WhistleSvgSmall() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }}
    >
      <circle
        cx="9"
        cy="14"
        r="5"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M14 14 L20 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M17 6 L22 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StopwatchSvg({ urgent }: { urgent: boolean }) {
  const stroke = urgent ? "#e53e3e" : "var(--fd-ink)";
  return (
    <svg
      aria-hidden
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-[2px] flex-shrink-0"
    >
      <circle
        cx="12"
        cy="14"
        r="8"
        stroke={stroke}
        strokeWidth="2"
        fill="rgba(93,185,245,0.1)"
      />
      <line
        x1="12"
        y1="14"
        x2="12"
        y2="9"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="14"
        x2="15"
        y2="12"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 3 L15 3"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="6"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RunnerSvg({ progress }: { progress: number }) {
  return (
    <svg
      aria-hidden
      width="18"
      height="24"
      viewBox="0 0 18 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute -top-2"
      style={{ left: `calc(${progress}% - 9px)` }}
    >
      <circle
        cx="9"
        cy="4"
        r="3"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        fill="rgba(93,199,122,0.4)"
      />
      <path
        d="M9 7 L9 16"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 10 L5 13"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 10 L13 8"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16 L6 22"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 16 L13 20"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckboxSvg({ checked }: { checked?: boolean }) {
  return (
    <svg
      aria-hidden
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-[1px] flex-shrink-0"
    >
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="4"
        stroke="var(--fd-ink)"
        strokeWidth="2"
        fill={checked ? "rgba(93,199,122,0.3)" : "rgba(122,106,92,0.1)"}
      />
      {checked && (
        <path
          d="M5 11 L9 15 L17 7"
          stroke="#5dc77a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function StarSvgSmall() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{
        display: "inline",
        verticalAlign: "middle",
        marginRight: "4px",
        flexShrink: 0,
      }}
    >
      <path
        d="M7 1 L8.5 5 L13 5 L9.5 7.5 L11 12 L7 9.5 L3 12 L4.5 7.5 L1 5 L5.5 5 Z"
        fill="var(--fd-gold)"
        stroke="var(--fd-ink)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MedallionSvg({ number }: { number: number }) {
  return (
    <svg
      aria-hidden
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="var(--fd-paper-deep)"
        stroke="var(--fd-ink)"
        strokeWidth="2"
      />
      <circle
        cx="16"
        cy="16"
        r="10"
        fill="none"
        stroke="var(--fd-ink)"
        strokeWidth="1"
        opacity="0.2"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="'DM Mono', monospace"
        fontSize="11"
        fontWeight="500"
        fill="var(--fd-ink)"
      >
        {String(number).padStart(2, "0")}
      </text>
    </svg>
  );
}

export function MedalSvg({ type }: { type: "gold" | "silver" | "bronze" }) {
  const colors: Record<string, string> = {
    gold: "#ffc847",
    silver: "#c5cdd6",
    bronze: "#cd9352",
  };
  const c = colors[type];
  return (
    <svg
      aria-hidden
      width="44"
      height="54"
      viewBox="0 0 44 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-[0.35rem]"
    >
      <line
        x1="16"
        y1="2"
        x2="12"
        y2="18"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="2"
        x2="32"
        y2="18"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="22"
        cy="34"
        r="16"
        fill={c}
        stroke="var(--fd-ink)"
        strokeWidth="2"
      />
      <circle
        cx="22"
        cy="34"
        r="11"
        fill="none"
        stroke="var(--fd-ink)"
        strokeWidth="1.5"
        opacity="0.3"
      />
    </svg>
  );
}
