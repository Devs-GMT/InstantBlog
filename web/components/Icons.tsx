// Minimal stroke icons (24px grid, currentColor).
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Icon = {
  cap: () => (
    <svg {...base} aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></svg>
  ),
  pen: () => (
    <svg {...base} aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
  ),
  rocket: () => (
    <svg {...base} aria-hidden="true"><path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2" /><path d="M9 12a22 22 0 0 1 11-9c0 4-1.4 8-9 11Z" /><path d="M9 12H5l2-4h5M12 15v4l4-2v-5" /></svg>
  ),
  chart: () => (
    <svg {...base} aria-hidden="true"><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></svg>
  ),
  code: () => (
    <svg {...base} aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>
  ),
  bolt: () => (
    <svg {...base} aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
  ),
  lock: () => (
    <svg {...base} aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
  ),
  clock: () => (
    <svg {...base} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  check: () => (
    <svg {...base} aria-hidden="true"><path d="M9 12l2 2 4-4" /><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" /></svg>
  ),
  copy: () => (
    <svg {...base} width={14} height={14} aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
  ),
};
