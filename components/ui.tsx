// components/ui.tsx
// Zajednicki UI gradivni blokovi (dugmad, status bedz, traka sati, pregled
// statusa), da dashboard i landing koriste isti vizuelni jezik umesto
// ponovljenih Tailwind klasa po stranicama.

import type { ReactNode } from "react";

export type Tone = "green" | "amber" | "red" | "muted";

const BASE_BUTTON =
  "inline-flex items-center justify-center rounded-md px-4.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors";

export const btnPrimary = `${BASE_BUTTON} bg-(--ink) text-(--paper) hover:bg-(--ink-hover)`;
export const btnSecondary = `${BASE_BUTTON} border border-(--line) bg-(--card) text-(--ink) hover:border-(--ink)`;

const TONE_DOT: Record<Tone, string> = {
  green: "bg-(--green)",
  amber: "bg-(--amber)",
  red: "bg-(--red)",
  muted: "bg-(--muted)",
};

const TONE_BADGE: Record<Tone, string> = {
  green: "bg-(--green-soft) text-(--green)",
  amber: "bg-(--amber-soft) text-(--amber-ink)",
  red: "bg-(--red-soft) text-(--red)",
  muted: "bg-(--paper2) text-(--muted)",
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_BADGE[tone]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${TONE_DOT[tone]}`} />
      {children}
    </span>
  );
}

// Tanka traka napretka za CE sate. Popunjena traka = obaveza ispunjena.
export function HoursBar({
  label,
  done,
  required,
}: {
  label: string;
  done: number;
  required: number;
}) {
  const pct = required > 0 ? Math.min(100, Math.round((done / required) * 100)) : 100;
  const complete = done >= required;
  return (
    <div>
      <div className="flex justify-between text-xs text-(--muted) mb-1">
        <span>{label}</span>
        <span className="tabular-nums">
          {done}/{required}h
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} hours`}
        aria-valuemin={0}
        aria-valuemax={required}
        aria-valuenow={Math.min(done, required)}
        className="h-1.5 rounded-full bg-(--paper2) overflow-hidden"
      >
        <div
          className={`h-full rounded-full ${complete ? "bg-(--green)" : "bg-(--amber)"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export type StatusSegment = { tone: Tone; label: string; count: number };

// Segmentirana traka: svaki segment je proporcionalan broju licenci u tom statusu.
export function StatusBar({ segments }: { segments: StatusSegment[] }) {
  const visible = segments.filter((s) => s.count > 0);
  const total = visible.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  return (
    <div>
      <div
        className="flex h-2.5 gap-0.5 rounded-full overflow-hidden"
        role="img"
        aria-label={visible.map((s) => `${s.count} ${s.label}`).join(", ")}
      >
        {visible.map((s) => (
          <div
            key={s.label}
            className={TONE_DOT[s.tone]}
            style={{ flexGrow: s.count, flexBasis: 0 }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 mt-3 list-none p-0 m-0">
        {visible.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-[13px] text-(--muted)">
            <span className={`w-2 h-2 rounded-full flex-none ${TONE_DOT[s.tone]}`} />
            <span className="font-semibold text-(--ink) tabular-nums">{s.count}</span>
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
