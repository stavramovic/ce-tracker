// lib/csv.ts
// Minimalan CSV builder bez zavisnosti. Pazi na dve stvari:
// 1) escaping (zarezi, navodnici, novi redovi) po RFC 4180,
// 2) CSV/formula injection: vrednost koja pocinje sa = + - @ (ili tab/CR)
//    bi Excel/Sheets izvrsili kao formulu, a labele su korisnicki unos
//    (npr. naziv carriera), pa ih prefiksiramo apostrofom.

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && typeof value === "string") {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(
  header: string[],
  rows: Array<Array<string | number | null | undefined>>
): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(","));
  // BOM da Excel ispravno otvori UTF-8; CRLF je standard za CSV.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
