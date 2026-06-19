export type Mapping = { from: string; to: string }

/** Column letter for a zero-based index: 0 → 'A', 1 → 'B', … (A–Z is plenty here). */
export function colLetter(i: number): string {
  return String.fromCharCode(65 + (i % 26))
}

/** Build the stored mapping from an ordered list of Notion property names. */
export function toMapping(fields: string[]): Mapping[] {
  return fields
    .map((f) => f.trim())
    .filter(Boolean)
    .map((from, i) => ({ from, to: colLetter(i) }))
}

/** Extract the ordered property names from a stored mapping. */
export function fromMapping(mapping: Mapping[] | undefined): string[] {
  return (mapping ?? []).map((m) => m.from)
}
