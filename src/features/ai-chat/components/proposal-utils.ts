type NamedRow = { id: string; name: string };

// Best-effort map of the AI's free-text category hint onto a real category id:
// exact name match first, then substring either way. Returns null when nothing
// matches so the user picks manually.
export function matchCategoryId(
  hint: string | null,
  options: NamedRow[] | undefined
): string | null {
  if (!hint || !options || options.length === 0) return null;
  const needle = hint.trim().toLowerCase();
  if (!needle) return null;
  const exact = options.find((o) => o.name.trim().toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = options.find((o) => {
    const name = o.name.trim().toLowerCase();
    return name.includes(needle) || needle.includes(name);
  });
  return partial?.id ?? null;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
