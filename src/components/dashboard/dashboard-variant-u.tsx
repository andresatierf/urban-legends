"use client";

import type { DashboardFixtureData } from "./dashboard-variant-fixtures";
import { formatRelative } from "./dashboard-variant-shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tournamentProgress(t: { startDate: string; endDate: string }): number {
  const now = Date.now();
  const start = new Date(t.startDate).getTime();
  const end = new Date(t.endDate).getTime();
  return Math.max(0, Math.min(1, (now - start) / Math.max(end - start, 1)));
}

function getWeekOfYear(d: Date): number {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// SVG Components
// ---------------------------------------------------------------------------

function PaperGrainSvg() {
  return (
    <svg
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.035,
      }}
    >
      <filter id="vu-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.72"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#vu-grain)" />
    </svg>
  );
}

function LaurelWreathSvg() {
  return (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* Left branch */}
      <path
        d="M4 24 C2 20, 1 16, 3 12 C5 8, 8 6, 10 8 C8 10, 7 14, 8 18 C6 20, 5 22, 4 24Z"
        fill="#bf9b30"
        opacity="0.8"
      />
      <path
        d="M7 22 C4 19, 3 14, 5 10 C7 7, 10 5, 12 7 C10 9, 9 13, 10 17Z"
        fill="#bf9b30"
        opacity="0.6"
      />
      <path
        d="M2 26 C1 22, 1 17, 4 13 C5 11, 7 10, 8 11 C6 14, 5 18, 6 22Z"
        fill="#bf9b30"
        opacity="0.5"
      />
      {/* Right branch (mirror) */}
      <path
        d="M44 24 C46 20, 47 16, 45 12 C43 8, 40 6, 38 8 C40 10, 41 14, 40 18 C42 20, 43 22, 44 24Z"
        fill="#bf9b30"
        opacity="0.8"
      />
      <path
        d="M41 22 C44 19, 45 14, 43 10 C41 7, 38 5, 36 7 C38 9, 39 13, 38 17Z"
        fill="#bf9b30"
        opacity="0.6"
      />
      <path
        d="M46 26 C47 22, 47 17, 44 13 C43 11, 41 10, 40 11 C42 14, 43 18, 42 22Z"
        fill="#bf9b30"
        opacity="0.5"
      />
      {/* Stem */}
      <path
        d="M22 28 Q24 26 26 28"
        stroke="#bf9b30"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
      <circle cx="24" cy="26" r="1.5" fill="#bf9b30" opacity="0.7" />
    </svg>
  );
}

function TrophySvg() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" aria-hidden>
      <path
        d="M8 4 H28 V18 C28 26, 22 30, 18 30 C14 30, 8 26, 8 18 Z"
        stroke="#bf9b30"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M2 4 H8 C8 8, 6 14, 4 14 C2 14, 2 8, 2 4Z"
        stroke="#bf9b30"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M28 4 H34 C34 8, 34 14, 32 14 C30 14, 28 8, 28 4Z"
        stroke="#bf9b30"
        strokeWidth="1.2"
        fill="none"
      />
      <line
        x1="18"
        y1="30"
        x2="18"
        y2="36"
        stroke="#bf9b30"
        strokeWidth="1.5"
      />
      <path d="M10 36 H26" stroke="#bf9b30" strokeWidth="1.5" />
      <path
        d="M12 40 H24 V44 H12 Z"
        stroke="#bf9b30"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M14 12 L16 11 L18 8 L20 11 L22 12 L20 14 L20 16 L18 15 L16 16 L16 14 Z"
        fill="#bf9b30"
        opacity="0.7"
      />
    </svg>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 56;
  const h = 20;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function VariantUStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400;1,9..144,600&family=Inter:wght@300;400;500;600&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');

/* ── TOKENS ── */
:root {
  --vu-parchment: #f6efe0;
  --vu-parchment-alt: #f0e8d5;
  --vu-parchment-dark: #e8dfc8;
  --vu-ink: #1a1814;
  --vu-ink-light: #3a3530;
  --vu-ink-muted: #6b6255;
  --vu-crimson: #8a1d2d;
  --vu-crimson-light: #a82438;
  --vu-crimson-pale: #f4e8ea;
  --vu-gold: #bf9b30;
  --vu-gold-light: #d4b050;
  --vu-gold-pale: #f5eed8;
  --vu-rule: #c8b890;
  --vu-rule-light: #ddd0b0;
  --vu-white: #fdfaf4;
  --vu-serif: 'Fraunces', 'Georgia', serif;
  --vu-sans: 'Inter', system-ui, sans-serif;
  --vu-mono: 'DM Mono', 'Courier New', monospace;
}

/* ── ROOT ── */
.vu-root {
  position: relative;
  min-height: 100vh;
  background: var(--vu-parchment);
  color: var(--vu-ink);
  font-family: var(--vu-sans);
  font-size: 14px;
  line-height: 1.55;
}

/* ── MASTHEAD ── */
.vu-masthead {
  border-bottom: 3px double var(--vu-rule);
  padding: 2rem 2.5rem 1.25rem;
  position: relative;
  z-index: 1;
  text-align: center;
}
.vu-masthead-vol {
  font-family: var(--vu-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.vu-masthead-rule-thin {
  flex: 1;
  height: 1px;
  background: var(--vu-rule);
  max-width: 80px;
}
.vu-masthead-title {
  font-family: var(--vu-serif);
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--vu-ink);
  font-optical-sizing: auto;
  margin: 0.1rem 0 0.5rem;
}
.vu-masthead-title em {
  font-style: italic;
  color: var(--vu-crimson);
}
.vu-masthead-subtitle {
  font-family: var(--vu-sans);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  margin-bottom: 0.75rem;
}
.vu-masthead-meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  font-family: var(--vu-sans);
  font-size: 11px;
  color: var(--vu-ink-muted);
  border-top: 1px solid var(--vu-rule);
  padding-top: 0.75rem;
  margin-top: 0.25rem;
}
.vu-masthead-meta-item strong {
  color: var(--vu-ink);
  font-weight: 600;
}

/* ── BODY LAYOUT ── */
.vu-body {
  position: relative;
  z-index: 1;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
}

/* ── SECTION HEADER ── */
.vu-section-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 2.5rem 0 1.1rem;
}
.vu-section-label {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  white-space: nowrap;
}
.vu-section-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--vu-gold), var(--vu-rule-light));
}
.vu-section-rule--left {
  flex: 0 0 20px;
  background: var(--vu-gold);
}

/* ── DROP CAP ── */
.vu-drop-cap::first-letter {
  float: left;
  font-family: var(--vu-serif);
  font-size: 4.2rem;
  font-weight: 700;
  line-height: 0.75;
  padding-right: 0.12em;
  padding-top: 0.08em;
  color: var(--vu-crimson);
  font-optical-sizing: auto;
}

/* ── METRIC CARDS ── */
.vu-metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--vu-rule);
  border: 1px solid var(--vu-rule);
  margin-bottom: 0.5rem;
  animation: vu-fade-lift 0.5s ease both;
}
@media (max-width: 700px) {
  .vu-metrics-row { grid-template-columns: repeat(2, 1fr); }
}
.vu-metric-card {
  background: var(--vu-white);
  padding: 1.25rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  position: relative;
  transition: box-shadow 0.2s ease;
}
.vu-metric-card:hover {
  box-shadow: 0 4px 16px rgba(26,24,20,0.10);
  z-index: 1;
}
.vu-metric-gold-rule {
  width: 28px;
  height: 2px;
  background: var(--vu-gold);
  margin-bottom: 0.5rem;
}
.vu-metric-label {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  font-variant: small-caps;
}
.vu-metric-value {
  font-family: var(--vu-serif);
  font-size: 2.8rem;
  font-weight: 700;
  line-height: 1;
  color: var(--vu-ink);
  font-optical-sizing: auto;
  font-variant-numeric: tabular-nums;
}
.vu-metric-unit {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  margin-bottom: 0.35rem;
}

/* ── MVP CARD ── */
.vu-mvp-card {
  border: 1px solid var(--vu-gold);
  background: var(--vu-white);
  padding: 1.5rem 2rem;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  position: relative;
  animation: vu-fade-lift 0.55s ease both;
  transition: box-shadow 0.2s ease;
}
.vu-mvp-card:hover {
  box-shadow: 0 6px 24px rgba(26,24,20,0.10);
}
.vu-mvp-card::before,
.vu-mvp-card::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: var(--vu-gold);
  border-style: solid;
}
.vu-mvp-card::before {
  top: -1px; left: -1px;
  border-width: 2px 0 0 2px;
}
.vu-mvp-card::after {
  bottom: -1px; right: -1px;
  border-width: 0 2px 2px 0;
}
.vu-mvp-icon {
  flex-shrink: 0;
  padding-top: 0.2rem;
}
.vu-mvp-body {
  flex: 1;
}
.vu-mvp-eyebrow {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--vu-gold);
  margin-bottom: 0.35rem;
}
.vu-mvp-name {
  font-family: var(--vu-serif);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--vu-ink);
  font-optical-sizing: auto;
  margin-bottom: 0.4rem;
}
.vu-mvp-detail {
  font-family: var(--vu-sans);
  font-size: 13px;
  color: var(--vu-ink-light);
  font-style: italic;
  line-height: 1.55;
  margin: 0;
}
.vu-mvp-detail strong {
  font-style: normal;
  font-weight: 600;
  color: var(--vu-ink);
}
.vu-mvp-laurel {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}

/* ── STANDINGS TABLE ── */
.vu-standings-wrap {
  overflow-x: auto;
  animation: vu-fade-lift 0.6s ease both;
}
.vu-standings-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--vu-sans);
}
.vu-standings-table thead tr {
  border-top: 2px solid var(--vu-ink);
  border-bottom: 2px solid var(--vu-ink);
}
.vu-standings-table thead th {
  padding: 0.6rem 0.75rem;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--vu-ink);
  text-align: left;
  white-space: nowrap;
  background: var(--vu-parchment);
}
.vu-standings-table thead th:first-child {
  padding-left: 0.5rem;
}
.vu-standings-table thead th.vu-th-right {
  text-align: right;
}
.vu-standings-table tbody tr {
  border-bottom: 1px solid var(--vu-rule-light);
  transition: background 0.15s ease;
}
.vu-standings-table tbody tr:nth-child(even) {
  background: var(--vu-parchment-alt);
}
.vu-standings-table tbody tr:hover {
  background: var(--vu-gold-pale);
}
.vu-standings-table td {
  padding: 0.65rem 0.75rem;
  vertical-align: middle;
}
.vu-standings-table tbody tr:last-child {
  border-bottom: 1.5px solid var(--vu-rule);
}
.vu-td-rank {
  font-family: var(--vu-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--vu-ink-muted);
  letter-spacing: 0.05em;
  min-width: 2.5rem;
}
.vu-td-team {
  min-width: 140px;
}
.vu-td-team-name {
  font-family: var(--vu-serif);
  font-size: 15px;
  font-weight: 600;
  color: var(--vu-ink);
  font-optical-sizing: auto;
}
.vu-td-cap {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--vu-gold);
  text-transform: uppercase;
  margin-left: 0.5rem;
  vertical-align: middle;
}
.vu-td-tour {
  font-size: 12px;
  color: var(--vu-ink-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vu-td-role {
  display: inline-block;
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.15em 0.5em;
  border: 1px solid currentColor;
}
.vu-td-role--captain { color: var(--vu-crimson); border-color: var(--vu-crimson); }
.vu-td-role--member { color: var(--vu-ink-muted); border-color: var(--vu-rule); }
.vu-td-num {
  font-family: var(--vu-mono);
  font-size: 13px;
  color: var(--vu-ink-muted);
  text-align: right;
}
.vu-td-points-cell {
  min-width: 180px;
}
.vu-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.vu-bar-track {
  flex: 1;
  height: 6px;
  background: var(--vu-parchment-dark);
  overflow: hidden;
}
.vu-bar-fill {
  height: 100%;
  background: var(--vu-crimson);
  transform-origin: left;
  animation: vu-bar-grow 0.6s cubic-bezier(0.22,1,0.36,1) both;
}
.vu-bar-num {
  font-family: var(--vu-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--vu-ink);
  min-width: 2.8rem;
  text-align: right;
  letter-spacing: 0.03em;
}

/* ── ROSTER UPDATE ── */
.vu-roster-callout {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--vu-white);
  border-left: 3px solid var(--vu-gold);
  animation: vu-fade-lift 0.5s ease both;
}
.vu-roster-label {
  font-family: var(--vu-sans);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  white-space: nowrap;
}
.vu-roster-number {
  font-family: var(--vu-serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--vu-gold);
  line-height: 1;
  font-optical-sizing: auto;
}
.vu-roster-delta {
  font-family: var(--vu-mono);
  font-size: 12px;
  color: var(--vu-ink-muted);
}
.vu-roster-desc {
  font-size: 12px;
  color: var(--vu-ink-muted);
  font-style: italic;
}

/* ── HEAD-TO-HEAD ── */
.vu-h2h-card {
  background: var(--vu-white);
  border: 1px solid var(--vu-rule);
  padding: 0;
  overflow: hidden;
  animation: vu-fade-lift 0.6s ease both;
  transition: box-shadow 0.2s ease;
}
.vu-h2h-card:hover {
  box-shadow: 0 6px 24px rgba(26,24,20,0.09);
}
.vu-h2h-cols {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
}
.vu-h2h-col {
  padding: 1.5rem 1.75rem;
}
.vu-h2h-col--user {
  background: var(--vu-white);
}
.vu-h2h-col--rival {
  background: var(--vu-parchment-alt);
}
.vu-h2h-eyebrow {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  margin-bottom: 0.4rem;
}
.vu-h2h-team-name {
  font-family: var(--vu-serif);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vu-ink);
  line-height: 1.2;
  margin-bottom: 0.5rem;
  font-optical-sizing: auto;
}
.vu-h2h-badge {
  display: inline-block;
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.15em 0.5em;
  border: 1px solid var(--vu-crimson);
  color: var(--vu-crimson);
  margin-bottom: 1rem;
}
.vu-h2h-badge--rival {
  border-color: var(--vu-rule);
  color: var(--vu-ink-muted);
}
.vu-h2h-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--vu-rule-light);
  font-size: 12px;
}
.vu-h2h-stat-row:last-child {
  border-bottom: none;
}
.vu-h2h-stat-label {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
}
.vu-h2h-stat-val {
  font-family: var(--vu-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--vu-ink);
}
.vu-h2h-stat-val--highlight {
  font-size: 16px;
  color: var(--vu-crimson);
  font-weight: 500;
}
.vu-h2h-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.75rem;
  background: var(--vu-parchment-dark);
  min-width: 60px;
  gap: 0.4rem;
}
.vu-h2h-vs-text {
  font-family: var(--vu-serif);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--vu-ink-muted);
  line-height: 1;
  font-optical-sizing: auto;
  letter-spacing: -0.02em;
}
.vu-h2h-margin-tag {
  font-family: var(--vu-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--vu-ink-muted);
  text-align: center;
}
.vu-h2h-margin-num {
  font-family: var(--vu-mono);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
.vu-h2h-margin-num--ahead { color: var(--vu-crimson); }
.vu-h2h-margin-num--behind { color: var(--vu-ink-muted); }
.vu-h2h-footer {
  border-top: 1px solid var(--vu-rule);
  padding: 0.65rem 1.75rem;
  font-family: var(--vu-sans);
  font-size: 10px;
  color: var(--vu-ink-muted);
  font-style: italic;
  text-align: center;
}

/* ── TODAY'S LINEUP (roster panel) ── */
.vu-lineup-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--vu-rule);
  overflow: hidden;
  animation: vu-fade-lift 0.65s ease both;
}
.vu-lineup-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--vu-rule-light);
  background: var(--vu-white);
  transition: background 0.15s ease;
}
.vu-lineup-row:last-child {
  border-bottom: none;
}
.vu-lineup-row:nth-child(even) {
  background: var(--vu-parchment-alt);
}
.vu-lineup-row:hover {
  background: var(--vu-gold-pale);
}
.vu-lineup-num {
  font-family: var(--vu-mono);
  font-size: 13px;
  color: var(--vu-ink-muted);
  min-width: 2rem;
}
.vu-lineup-name {
  font-family: var(--vu-serif);
  font-size: 15px;
  font-weight: 600;
  color: var(--vu-ink);
  flex: 1;
  font-optical-sizing: auto;
}
.vu-lineup-tour {
  font-size: 11px;
  color: var(--vu-ink-muted);
  flex: 1;
}
.vu-lineup-role {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.15em 0.5em;
  border: 1px solid currentColor;
}
.vu-lineup-role--captain { color: var(--vu-crimson); }
.vu-lineup-role--member { color: var(--vu-ink-muted); }
.vu-lineup-pts {
  font-family: var(--vu-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--vu-ink);
  min-width: 3rem;
  text-align: right;
}
.vu-lineup-pts-label {
  font-size: 9px;
  color: var(--vu-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-left: 0.25rem;
}
.vu-lineup-members {
  font-family: var(--vu-mono);
  font-size: 11px;
  color: var(--vu-ink-muted);
  min-width: 4rem;
  text-align: right;
}

/* ── TWO-COLUMN LAYOUT ── */
.vu-twocol {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 760px) {
  .vu-twocol { grid-template-columns: 1fr; }
}
.vu-threecol {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 900px) {
  .vu-threecol { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .vu-threecol { grid-template-columns: 1fr; }
}

/* ── DISPATCHES (activity feed) ── */
.vu-dispatches {
  border: 1px solid var(--vu-rule);
  background: var(--vu-white);
  overflow: hidden;
  animation: vu-fade-lift 0.7s ease both;
}
.vu-dispatch-head {
  background: var(--vu-ink);
  padding: 0.5rem 1rem;
}
.vu-dispatch-head-label {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--vu-parchment);
}
.vu-dispatch-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--vu-rule-light);
  transition: background 0.15s ease;
}
.vu-dispatch-item:last-child {
  border-bottom: none;
}
.vu-dispatch-item:hover {
  background: var(--vu-parchment-alt);
}
.vu-dispatch-icon {
  font-family: var(--vu-mono);
  font-size: 11px;
  color: var(--vu-gold);
  flex-shrink: 0;
  padding-top: 0.1rem;
  letter-spacing: 0;
}
.vu-dispatch-desc {
  font-size: 12px;
  color: var(--vu-ink-light);
  flex: 1;
  line-height: 1.4;
}
.vu-dispatch-time {
  font-family: var(--vu-mono);
  font-size: 10px;
  color: var(--vu-ink-muted);
  flex-shrink: 0;
  padding-top: 0.15rem;
}

/* ── DEADLINES ── */
.vu-deadline-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--vu-rule);
  overflow: hidden;
  animation: vu-fade-lift 0.65s ease both;
}
.vu-deadline-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  background: var(--vu-white);
  border-bottom: 1px solid var(--vu-rule-light);
}
.vu-deadline-item:last-child {
  border-bottom: none;
}
.vu-deadline-item--urgent {
  background: var(--vu-crimson-pale);
}
.vu-deadline-days {
  font-family: var(--vu-mono);
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--vu-ink);
  min-width: 2.2rem;
}
.vu-deadline-days--urgent {
  color: var(--vu-crimson);
}
.vu-deadline-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--vu-ink);
}
.vu-deadline-tag {
  font-family: var(--vu-sans);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vu-white);
  background: var(--vu-crimson);
  padding: 0.2em 0.5em;
}
.vu-deadline-label {
  font-size: 11px;
  color: var(--vu-ink-muted);
}

/* ── CORRESPONDENCE (invitations + join requests) ── */
.vu-corr-item {
  background: var(--vu-white);
  border: 1px solid var(--vu-rule);
  padding: 1rem 1.25rem;
  margin-bottom: 0.6rem;
  position: relative;
  transition: box-shadow 0.18s ease;
  animation: vu-fade-lift 0.5s ease both;
}
.vu-corr-item:hover {
  box-shadow: 0 4px 14px rgba(26,24,20,0.09);
}
.vu-corr-type {
  font-family: var(--vu-sans);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  margin-bottom: 0.3rem;
}
.vu-corr-team {
  font-family: var(--vu-serif);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vu-ink);
  line-height: 1.2;
  font-optical-sizing: auto;
}
.vu-corr-meta {
  font-size: 11px;
  color: var(--vu-ink-muted);
  margin: 0.3rem 0 0.8rem;
  font-style: italic;
}
.vu-corr-actions {
  display: flex;
  gap: 0.5rem;
}
.vu-btn {
  display: inline-block;
  font-family: var(--vu-sans);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: lowercase;
  padding: 0.35em 0.85em;
  border: 1px solid;
  cursor: pointer;
  background: transparent;
  transition: background 0.15s ease, color 0.15s ease;
  line-height: 1.5;
}
.vu-btn--accept {
  color: var(--vu-crimson);
  border-color: var(--vu-crimson);
}
.vu-btn--accept:hover {
  background: var(--vu-crimson);
  color: var(--vu-white);
}
.vu-btn--decline {
  color: var(--vu-ink-muted);
  border-color: var(--vu-rule);
}
.vu-btn--decline:hover {
  background: var(--vu-parchment-dark);
  color: var(--vu-ink);
}

/* ── PENDING SUBMISSIONS ── */
.vu-pending-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--vu-sans);
  font-size: 12px;
  animation: vu-fade-lift 0.65s ease both;
}
.vu-pending-table thead th {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
  text-align: left;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--vu-rule);
}
.vu-pending-table tbody td {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--vu-rule-light);
  color: var(--vu-ink-light);
  vertical-align: middle;
}
.vu-pending-table tbody tr:last-child td {
  border-bottom: none;
}
.vu-pending-table tbody tr:nth-child(even) td {
  background: var(--vu-parchment-alt);
}
.vu-state-badge {
  font-family: var(--vu-sans);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.2em 0.5em;
  border: 1px solid;
}
.vu-state-badge--pending {
  color: var(--vu-gold);
  border-color: var(--vu-gold);
}
.vu-state-badge--approved {
  color: #2d6a4f;
  border-color: #2d6a4f;
}
.vu-state-badge--rejected {
  color: var(--vu-crimson);
  border-color: var(--vu-crimson);
}

/* ── EDITOR'S DESK (admin) ── */
.vu-editors-desk {
  border: 2px solid var(--vu-ink);
  background: var(--vu-white);
  animation: vu-fade-lift 0.5s ease both;
}
.vu-editors-desk-head {
  background: var(--vu-ink);
  padding: 0.6rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.vu-editors-desk-title {
  font-family: var(--vu-serif);
  font-size: 1rem;
  font-weight: 600;
  color: var(--vu-parchment);
  font-optical-sizing: auto;
}
.vu-editors-desk-badge {
  font-family: var(--vu-mono);
  font-size: 9px;
  color: var(--vu-gold);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.vu-editors-desk-body {
  padding: 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}
.vu-desk-stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.vu-desk-stat-label {
  font-family: var(--vu-sans);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vu-ink-muted);
}
.vu-desk-stat-val {
  font-family: var(--vu-mono);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--vu-ink);
  line-height: 1;
}
.vu-desk-stat-val--gold { color: var(--vu-gold); }
.vu-desk-stat-val--crimson { color: var(--vu-crimson); }
.vu-desk-stat-sub {
  font-size: 10px;
  color: var(--vu-ink-muted);
}
.vu-desk-divider {
  grid-column: 1 / -1;
  height: 1px;
  background: var(--vu-rule-light);
  margin: 0.25rem 0;
}

/* ── ANIMATIONS ── */
@keyframes vu-fade-lift {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes vu-bar-grow {
  from { width: 0 !important; }
  to { /* width is set inline */ }
}

/* ── UTILITY ── */
.vu-empty {
  font-size: 13px;
  color: var(--vu-ink-muted);
  font-style: italic;
  padding: 1rem 0;
}
.vu-gold-text { color: var(--vu-gold); }
.vu-crimson-text { color: var(--vu-crimson); }
.vu-section-stagger-1 { animation-delay: 0.05s; }
.vu-section-stagger-2 { animation-delay: 0.10s; }
.vu-section-stagger-3 { animation-delay: 0.15s; }
.vu-section-stagger-4 { animation-delay: 0.20s; }
.vu-section-stagger-5 { animation-delay: 0.25s; }
.vu-section-stagger-6 { animation-delay: 0.30s; }
.vu-section-stagger-7 { animation-delay: 0.35s; }
        `,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHead({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="vu-section-head">
      <div className="vu-section-rule vu-section-rule--left" />
      <span className="vu-section-label">
        {label}
        {sub && (
          <span style={{ opacity: 0.6, marginLeft: "0.5em" }}>· {sub}</span>
        )}
      </span>
      <div className="vu-section-rule" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  sparkline,
}: {
  label: string;
  value: number | string;
  unit: string;
  sparkline?: number[];
}) {
  return (
    <div className="vu-metric-card">
      <div className="vu-metric-gold-rule" />
      <span className="vu-metric-label">{label}</span>
      <span className="vu-metric-value">{value}</span>
      <span className="vu-metric-unit">{unit}</span>
      {sparkline && sparkline.length > 1 && (
        <Sparkline values={sparkline} color="#bf9b30" />
      )}
    </div>
  );
}

function DispatchIcon({ type }: { type: string }) {
  if (type === "submission_approved")
    return <span className="vu-dispatch-icon">✓</span>;
  if (type === "submission_rejected")
    return <span className="vu-dispatch-icon">✗</span>;
  if (type === "team_member_joined")
    return <span className="vu-dispatch-icon">+</span>;
  if (type === "join_request_approved")
    return <span className="vu-dispatch-icon">◆</span>;
  if (type === "join_request_rejected")
    return <span className="vu-dispatch-icon">◇</span>;
  return <span className="vu-dispatch-icon">·</span>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DashboardVariantU({ data }: { data: DashboardFixtureData }) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekNo = getWeekOfYear(today);
  const issueNo = String(weekNo).padStart(3, "0");

  // Standings: sort by points desc
  const standings = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const maxPts = standings[0]?.team.points ?? 1;

  // Active teams
  const activeTeams = data.teams.filter(
    (t) =>
      t.tournament.startDate <= todayStr && t.tournament.endDate >= todayStr,
  );

  // Head-to-head
  const sortedByPoints = [...data.teams].sort(
    (a, b) => b.team.points - a.team.points,
  );
  const userTopTeam = sortedByPoints[0] ?? null;
  const rivalTeam =
    sortedByPoints.length > 1
      ? (sortedByPoints.find((t) => t.team._id !== userTopTeam?.team._id) ??
        null)
      : null;
  const rivalName = rivalTeam?.team.name ?? "Iron Wolves";
  const rivalPoints = rivalTeam ? rivalTeam.team.points + 80 : 400;
  const rivalMembers = rivalTeam?.memberCount ?? 5;
  const rivalProgress = rivalTeam
    ? tournamentProgress(rivalTeam.tournament)
    : 0.72;
  const userProgress = userTopTeam
    ? tournamentProgress(userTopTeam.tournament)
    : 0;

  // Team of the Day: team with most approved submissions today, then all-time, then points
  const mvpStats = data.teams.map((t) => ({
    team: t,
    submissionsToday: data.activities.filter(
      (a) =>
        a.type === "submission_approved" &&
        a.description.includes(t.team.name) &&
        new Date(a.timestamp).toISOString().slice(0, 10) === todayStr,
    ).length,
    submissionsAllTime: data.activities.filter(
      (a) =>
        a.type === "submission_approved" && a.description.includes(t.team.name),
    ).length,
  }));
  const mvpEntry =
    [...mvpStats].sort(
      (a, b) =>
        b.submissionsToday - a.submissionsToday ||
        b.submissionsAllTime - a.submissionsAllTime ||
        b.team.team.points - a.team.team.points,
    )[0] ?? null;
  const mvpTeam = mvpEntry?.team ?? data.teams[0] ?? null;
  const mvpCountToday = mvpEntry?.submissionsToday ?? 0;
  const mvpCountTotal = mvpEntry?.submissionsAllTime ?? 0;
  const mvpDisplayCount = mvpCountToday > 0 ? mvpCountToday : mvpCountTotal;

  // Metric cards data
  const streakDays = 7; // simulated
  const activitiesThisWeek = data.activities.filter(
    (a) => Date.now() - a.timestamp < 7 * 86_400_000,
  ).length;
  const todayApproved = data.activities.filter(
    (a) =>
      a.type === "submission_approved" && Date.now() - a.timestamp < 86_400_000,
  ).length;
  const squadRank =
    standings.findIndex((t) => t.userRole === "captain") + 1 || 1;

  // Roster update
  const totalContestants =
    data.isAdmin && data.adminStats
      ? data.adminStats.users.total
      : data.teams.reduce((sum, t) => sum + t.memberCount, 0);
  const newThisWeek =
    data.isAdmin && data.adminStats
      ? data.adminStats.users.newThisWeek
      : data.activities.filter(
          (a) =>
            a.type === "team_member_joined" &&
            Date.now() - a.timestamp < 7 * 86_400_000,
        ).length;

  // Approval %
  const approvalPct =
    data.isAdmin && data.adminStats
      ? Math.round(
          (data.adminStats.submissions.approved /
            Math.max(
              data.adminStats.submissions.approved +
                data.adminStats.submissions.rejected,
              1,
            )) *
            100,
        )
      : null;

  const hasUrgentDeadlines = data.deadlines.some((d) => d.daysUntilEnd <= 3);

  return (
    <>
      <VariantUStyles />
      <PaperGrainSvg />

      <div className="vu-root">
        {/* ─── MASTHEAD ─── */}
        <header className="vu-masthead">
          <div className="vu-masthead-vol">
            <div className="vu-masthead-rule-thin" />
            <span>Urban Legends Almanack</span>
            <span>·</span>
            <span>Issue No. {issueNo}</span>
            <div className="vu-masthead-rule-thin" />
          </div>
          <h1 className="vu-masthead-title">
            The <em>Season</em> in Review
          </h1>
          <p className="vu-masthead-subtitle">
            The Official Record of Sport &amp; Endeavour
          </p>
          <div className="vu-masthead-meta-row">
            <span className="vu-masthead-meta-item">
              <strong>{formatDate(today)}</strong>
            </span>
            <span>·</span>
            <span className="vu-masthead-meta-item">
              Welcome back, <strong>{data.userName}</strong>
            </span>
            <span>·</span>
            <span className="vu-masthead-meta-item">
              <strong>{data.activeTournamentsCount}</strong> active tournaments
            </span>
            <span>·</span>
            <span className="vu-masthead-meta-item">
              <strong>{data.pendingSubmissionsCount}</strong> pending
            </span>
            {data.invitationsCount > 0 && (
              <>
                <span>·</span>
                <span className="vu-masthead-meta-item">
                  <strong>{data.invitationsCount}</strong> correspondence
                </span>
              </>
            )}
          </div>
        </header>

        <div className="vu-body">
          {/* ─── METRIC CARDS ─── */}
          <SectionHead label="Season Statbox" />
          <div className="vu-metrics-row vu-section-stagger-1">
            <MetricCard
              label="Streak"
              value={streakDays}
              unit="Days Consecutive"
              sparkline={[3, 4, 4, 5, 6, 6, 7]}
            />
            <MetricCard
              label="This Week"
              value={activitiesThisWeek}
              unit="Activities Logged"
              sparkline={[1, 2, 1, 3, 2, 3, activitiesThisWeek]}
            />
            <MetricCard
              label="Today"
              value={todayApproved}
              unit="Approved"
              sparkline={[0, 1, 0, 1, 1, 0, todayApproved]}
            />
            <MetricCard
              label="Squad Rank"
              value={squadRank}
              unit="Rank in Standing"
              sparkline={[4, 3, 3, 2, 2, 2, squadRank]}
            />
          </div>

          {/* ─── TEAM OF THE DAY ─── */}
          <SectionHead label="Squad of the Day" />
          <div className="vu-mvp-card vu-section-stagger-2">
            <div className="vu-mvp-icon">
              <TrophySvg />
            </div>
            <div className="vu-mvp-body">
              <div className="vu-mvp-eyebrow">Squad of the Day</div>
              {mvpTeam ? (
                <>
                  <div className="vu-mvp-name">{mvpTeam.team.name}</div>
                  <p className="vu-mvp-detail vu-drop-cap">
                    <em>{mvpTeam.tournament.name}</em> &mdash; {mvpDisplayCount}{" "}
                    submission{mvpDisplayCount === 1 ? "" : "s"}{" "}
                    {mvpCountToday > 0 ? "today" : "this period"}.{" "}
                    {mvpTeam.memberCount} member
                    {mvpTeam.memberCount === 1 ? "" : "s"}
                    {mvpTeam.userRole === "captain" ? (
                      <strong>, captained by you</strong>
                    ) : null}
                    .
                  </p>
                </>
              ) : (
                <div className="vu-mvp-name">No team data</div>
              )}
            </div>
            <div className="vu-mvp-laurel" aria-hidden>
              <LaurelWreathSvg />
            </div>
          </div>

          {/* ─── ROSTER UPDATE ─── */}
          <SectionHead label="Roster Update" sub="Contestant Registry" />
          <div
            className="vu-roster-callout vu-section-stagger-2"
            style={{ animationDelay: "0.08s" }}
          >
            <span className="vu-roster-label">Contestants on Record</span>
            <span className="vu-roster-number">{totalContestants}</span>
            <span className="vu-roster-delta">(+{newThisWeek} this week)</span>
            <span className="vu-roster-desc">
              {data.isAdmin
                ? "Registered across all active tournaments."
                : "Combined squad membership."}
            </span>
          </div>

          {/* ─── LEAGUE STANDINGS ─── */}
          <SectionHead label="League Standings" sub="Sorted by Points" />
          <div className="vu-standings-wrap vu-section-stagger-3">
            <table className="vu-standings-table">
              <thead>
                <tr>
                  <th style={{ width: "2.5rem" }}>#</th>
                  <th>Team</th>
                  <th>Tournament</th>
                  <th style={{ width: "5.5rem" }}>Role</th>
                  <th className="vu-th-right" style={{ width: "3.5rem" }}>
                    Mbr
                  </th>
                  <th style={{ width: "14rem" }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "1.5rem",
                        textAlign: "center",
                        color: "var(--vu-ink-muted)",
                        fontStyle: "italic",
                        fontSize: "13px",
                      }}
                    >
                      No teams enrolled yet.
                    </td>
                  </tr>
                )}
                {standings.map((t, i) => (
                  <tr key={t.team._id}>
                    <td className="vu-td-rank">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="vu-td-team">
                      <span className="vu-td-team-name">{t.team.name}</span>
                      {t.userRole === "captain" && (
                        <span className="vu-td-cap">★ captain</span>
                      )}
                    </td>
                    <td className="vu-td-tour">{t.tournament.name}</td>
                    <td>
                      <span className={`vu-td-role vu-td-role--${t.userRole}`}>
                        {t.userRole}
                      </span>
                    </td>
                    <td className="vu-td-num">
                      {t.memberCount.toString().padStart(2, "0")}
                    </td>
                    <td className="vu-td-points-cell">
                      <div className="vu-bar-wrap">
                        <div className="vu-bar-track">
                          <div
                            className="vu-bar-fill"
                            style={{
                              width: `${(t.team.points / maxPts) * 100}%`,
                              animationDelay: `${0.3 + i * 0.12}s`,
                            }}
                          />
                        </div>
                        <span className="vu-bar-num">
                          {t.team.points.toString().padStart(4, "0")}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── HEAD-TO-HEAD + TODAY'S LINEUP ─── */}
          {userTopTeam && (
            <>
              <SectionHead label="Head to Head" sub="Tale of the Tape" />
              <div className="vu-h2h-card vu-section-stagger-4">
                <div className="vu-h2h-cols">
                  {/* User column */}
                  <div className="vu-h2h-col vu-h2h-col--user">
                    <div className="vu-h2h-eyebrow">Your Squad</div>
                    <div className="vu-h2h-team-name">
                      {userTopTeam.team.name}
                    </div>
                    <span className="vu-h2h-badge">
                      {userTopTeam.userRole === "captain"
                        ? "Captain"
                        : "Member"}
                    </span>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Points</span>
                      <span className="vu-h2h-stat-val vu-h2h-stat-val--highlight">
                        {userTopTeam.team.points}
                      </span>
                    </div>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Members</span>
                      <span className="vu-h2h-stat-val">
                        {userTopTeam.memberCount}
                      </span>
                    </div>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Progress</span>
                      <span className="vu-h2h-stat-val">
                        {Math.round(userProgress * 100)}%
                      </span>
                    </div>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Tournament</span>
                      <span
                        className="vu-h2h-stat-val"
                        style={{
                          fontSize: "11px",
                          maxWidth: "120px",
                          textAlign: "right",
                        }}
                      >
                        {userTopTeam.tournament.name}
                      </span>
                    </div>
                  </div>

                  {/* VS divider */}
                  <div className="vu-h2h-vs">
                    <span className="vu-h2h-vs-text">vs.</span>
                    <span className="vu-h2h-margin-tag">Margin</span>
                    <span
                      className={`vu-h2h-margin-num ${
                        userTopTeam.team.points >= rivalPoints
                          ? "vu-h2h-margin-num--ahead"
                          : "vu-h2h-margin-num--behind"
                      }`}
                    >
                      {Math.abs(userTopTeam.team.points - rivalPoints)}
                    </span>
                    <span
                      className="vu-h2h-margin-tag"
                      style={{ fontSize: "8px" }}
                    >
                      {userTopTeam.team.points >= rivalPoints
                        ? "▲ ahead"
                        : "▼ behind"}
                    </span>
                  </div>

                  {/* Rival column */}
                  <div className="vu-h2h-col vu-h2h-col--rival">
                    <div className="vu-h2h-eyebrow">Top Rival</div>
                    <div className="vu-h2h-team-name">{rivalName}</div>
                    <span className="vu-h2h-badge vu-h2h-badge--rival">
                      Opponent
                    </span>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Points</span>
                      <span className="vu-h2h-stat-val vu-h2h-stat-val--highlight">
                        {rivalPoints}
                      </span>
                    </div>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Members</span>
                      <span className="vu-h2h-stat-val">{rivalMembers}</span>
                    </div>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Progress</span>
                      <span className="vu-h2h-stat-val">
                        {Math.round(rivalProgress * 100)}%
                      </span>
                    </div>
                    <div className="vu-h2h-stat-row">
                      <span className="vu-h2h-stat-label">Tournament</span>
                      <span
                        className="vu-h2h-stat-val"
                        style={{
                          fontSize: "11px",
                          maxWidth: "120px",
                          textAlign: "right",
                        }}
                      >
                        {rivalTeam
                          ? rivalTeam.tournament.name
                          : userTopTeam.tournament.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="vu-h2h-footer">
                  Comparative standing as of {formatDate(today)}. Rankings
                  provisional until season close.
                </div>
              </div>
            </>
          )}

          {/* ─── TODAY'S LINEUP ─── */}
          <SectionHead label="Today's Lineup" sub="Starting Roster" />
          <div className="vu-lineup-list vu-section-stagger-4">
            {data.teams.length === 0 && (
              <p className="vu-empty" style={{ padding: "1rem 1.25rem" }}>
                No squads on the roster yet.
              </p>
            )}
            {data.teams.map((t, idx) => (
              <div key={t.team._id} className="vu-lineup-row">
                <span className="vu-lineup-num">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="vu-lineup-name">{t.team.name}</span>
                <span className="vu-lineup-tour">{t.tournament.name}</span>
                <span
                  className={`vu-lineup-role vu-lineup-role--${t.userRole}`}
                >
                  {t.userRole}
                </span>
                <span className="vu-lineup-pts">
                  {t.team.points}
                  <span className="vu-lineup-pts-label">pts</span>
                </span>
                <span className="vu-lineup-members">
                  {t.memberCount} <span style={{ fontSize: "9px" }}>mbr</span>
                </span>
              </div>
            ))}
          </div>

          {/* ─── LOWER COLUMNS: DISPATCHES + DEADLINES ─── */}
          <div className="vu-twocol" style={{ marginTop: "0" }}>
            {/* Latest Dispatches */}
            <div>
              <SectionHead label="Latest Dispatches" sub="Activity Feed" />
              <div className="vu-dispatches vu-section-stagger-5">
                <div className="vu-dispatch-head">
                  <span className="vu-dispatch-head-label">
                    Recent Despatches from the Field
                  </span>
                </div>
                {data.activities.length === 0 && (
                  <p className="vu-empty" style={{ padding: "1rem" }}>
                    No despatches received.
                  </p>
                )}
                {data.activities.slice(0, 8).map((a, i) => (
                  <div key={i} className="vu-dispatch-item">
                    <DispatchIcon type={a.type} />
                    <span className="vu-dispatch-desc">{a.description}</span>
                    <span className="vu-dispatch-time">
                      {formatRelative(a.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadlines */}
            <div>
              <SectionHead
                label="Closing Dates"
                sub={hasUrgentDeadlines ? "Urgent Items" : undefined}
              />
              {data.deadlines.length > 0 ? (
                <div className="vu-deadline-list vu-section-stagger-5">
                  {data.deadlines.map((d) => (
                    <div
                      key={d.tournament._id}
                      className={`vu-deadline-item${d.daysUntilEnd <= 3 ? " vu-deadline-item--urgent" : ""}`}
                    >
                      <span
                        className={`vu-deadline-days${d.daysUntilEnd <= 3 ? " vu-deadline-days--urgent" : ""}`}
                      >
                        {d.daysUntilEnd}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="vu-deadline-name">
                          {d.tournament.name}
                        </div>
                        <div className="vu-deadline-label">
                          {d.daysUntilEnd <= 1
                            ? "Closes tomorrow — submit at once"
                            : `${d.daysUntilEnd} days remaining`}
                        </div>
                      </div>
                      {d.daysUntilEnd <= 3 && (
                        <span className="vu-deadline-tag">Closing</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="vu-empty">No forthcoming deadlines.</p>
              )}

              {/* Pending Submissions */}
              {data.pendingSubmissions.length > 0 && (
                <>
                  <SectionHead
                    label="Pending Returns"
                    sub="Awaiting Decision"
                  />
                  <table className="vu-pending-table vu-section-stagger-6">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Tournament</th>
                        <th>Date</th>
                        <th>State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pendingSubmissions.map((s) => (
                        <tr key={s.id}>
                          <td>{s.teamName}</td>
                          <td
                            style={{
                              maxWidth: "120px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.tournamentName}
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: "var(--vu-mono)",
                                fontSize: "11px",
                              }}
                            >
                              {s.date}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`vu-state-badge vu-state-badge--${s.state}`}
                            >
                              {s.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          {/* ─── CORRESPONDENCE (invitations + join requests) ─── */}
          {(data.invitations.length > 0 || data.joinRequests.length > 0) && (
            <>
              <SectionHead label="Correspondence" sub="Awaiting Reply" />
              <div className="vu-twocol">
                {/* Invitations */}
                {data.invitations.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--vu-sans)",
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--vu-ink-muted)",
                        marginBottom: "0.75rem",
                        paddingBottom: "0.4rem",
                        borderBottom: "1px solid var(--vu-rule-light)",
                      }}
                    >
                      Team Invitations
                    </div>
                    {data.invitations.map((inv) => (
                      <div key={inv.id} className="vu-corr-item">
                        <div className="vu-corr-type">Invitation received</div>
                        <div className="vu-corr-team">{inv.teamName}</div>
                        <div className="vu-corr-meta">
                          {inv.tournamentName} · from {inv.invitedBy} ·{" "}
                          {formatRelative(inv.timestamp)}
                        </div>
                        <div className="vu-corr-actions">
                          <button
                            className="vu-btn vu-btn--accept"
                            type="button"
                          >
                            sign him up
                          </button>
                          <button
                            className="vu-btn vu-btn--decline"
                            type="button"
                          >
                            with regrets
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Join Requests */}
                {data.joinRequests.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--vu-sans)",
                        fontSize: "9px",
                        fontWeight: 600,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--vu-ink-muted)",
                        marginBottom: "0.75rem",
                        paddingBottom: "0.4rem",
                        borderBottom: "1px solid var(--vu-rule-light)",
                      }}
                    >
                      Requests to Join
                    </div>
                    {data.joinRequests.map((jr) => (
                      <div key={jr.id} className="vu-corr-item">
                        <div className="vu-corr-type">Application received</div>
                        <div className="vu-corr-team">{jr.userName}</div>
                        <div className="vu-corr-meta">
                          Applies to join {jr.teamName} ·{" "}
                          {formatRelative(jr.timestamp)}
                        </div>
                        <div className="vu-corr-actions">
                          <button
                            className="vu-btn vu-btn--accept"
                            type="button"
                          >
                            add to ledger
                          </button>
                          <button
                            className="vu-btn vu-btn--decline"
                            type="button"
                          >
                            decline entry
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── EDITOR'S DESK (admin only) ─── */}
          {data.isAdmin && data.adminStats && (
            <>
              <SectionHead label="Editor's Desk" sub="Administration" />
              <div className="vu-editors-desk vu-section-stagger-7">
                <div className="vu-editors-desk-head">
                  <span className="vu-editors-desk-title">
                    Editorial Administration
                  </span>
                  <span className="vu-editors-desk-badge">Admin View</span>
                </div>
                <div className="vu-editors-desk-body">
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Contestants</span>
                    <span className="vu-desk-stat-val vu-desk-stat-val--gold">
                      {data.adminStats.users.total}
                    </span>
                    <span className="vu-desk-stat-sub">
                      +{data.adminStats.users.newThisWeek} this week
                    </span>
                  </div>
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Tournaments</span>
                    <span className="vu-desk-stat-val">
                      {data.adminStats.tournaments.total}
                    </span>
                    <span className="vu-desk-stat-sub">
                      {data.adminStats.tournaments.active} active ·{" "}
                      {data.adminStats.tournaments.upcoming} upcoming
                    </span>
                  </div>
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Teams</span>
                    <span className="vu-desk-stat-val">
                      {data.adminStats.teams.total}
                    </span>
                    <span className="vu-desk-stat-sub">enrolled</span>
                  </div>
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">
                      Tournaments Ended
                    </span>
                    <span className="vu-desk-stat-val">
                      {data.adminStats.tournaments.ended}
                    </span>
                    <span className="vu-desk-stat-sub">concluded</span>
                  </div>
                  <div className="vu-desk-divider" />
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Submissions</span>
                    <span className="vu-desk-stat-val">
                      {data.adminStats.submissions.total}
                    </span>
                    <span className="vu-desk-stat-sub">total received</span>
                  </div>
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Pending Review</span>
                    <span
                      className={`vu-desk-stat-val${
                        data.adminStats.submissions.pending > 0
                          ? " vu-desk-stat-val--crimson"
                          : ""
                      }`}
                    >
                      {data.adminStats.submissions.pending}
                    </span>
                    <span className="vu-desk-stat-sub">awaiting decision</span>
                  </div>
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Approved</span>
                    <span className="vu-desk-stat-val vu-desk-stat-val--gold">
                      {data.adminStats.submissions.approved}
                    </span>
                    <span className="vu-desk-stat-sub">accepted</span>
                  </div>
                  <div className="vu-desk-stat">
                    <span className="vu-desk-stat-label">Approval Rate</span>
                    <span className="vu-desk-stat-val vu-desk-stat-val--gold">
                      {approvalPct}%
                    </span>
                    <span className="vu-desk-stat-sub">of decided returns</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── COLOPHON ─── */}
          <div
            style={{
              marginTop: "3rem",
              paddingTop: "1rem",
              borderTop: "2px double var(--vu-rule)",
              textAlign: "center",
              fontFamily: "var(--vu-mono)",
              fontSize: "10px",
              color: "var(--vu-ink-muted)",
              letterSpacing: "0.15em",
            }}
          >
            Urban Legends Almanack · Issue {issueNo} · {today.getFullYear()}{" "}
            Edition · Printed for Private Circulation
          </div>
        </div>
      </div>
    </>
  );
}
