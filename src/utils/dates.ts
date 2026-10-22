// ── BUILD A VALID DATE FROM DAY / MONTH / YEAR INPUTS ─────────
// Returns null if the inputs don't form a real calendar date.
//
// Why: new Date(2027, 1, 31) doesn't fail — JavaScript silently
// rolls it over to 3 March. So we build the date, then check the
// day/month/year didn't change.
export const buildValidDate = (
  day: string,
  month: string,
  year: string
): Date | null => {
  const isWholeNumber = (v: string) => /^\d+$/.test(v.trim());
  if (!isWholeNumber(day) || !isWholeNumber(month) || !isWholeNumber(year)) return null;

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (y < 2024 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null; // e.g. 31/02 or 31/04
  }
  return date;
};
