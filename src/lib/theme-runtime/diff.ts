export type DiffLine = { type: "same" | "add" | "remove"; text: string };

/** Line-based diff (LCS). Theme files are small, so the quadratic table is fine. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : before.split("\n");
  const b = after === "" ? [] : after.split("\n");
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ type: "remove", text: a[i++] });
    } else {
      out.push({ type: "add", text: b[j++] });
    }
  }
  while (i < a.length) out.push({ type: "remove", text: a[i++] });
  while (j < b.length) out.push({ type: "add", text: b[j++] });
  return out;
}

export type FileChange = "added" | "removed" | "modified" | "unchanged";

/** Per-file status between two file maps. */
export function diffFileSets(before: Record<string, string>, after: Record<string, string>): Record<string, FileChange> {
  const result: Record<string, FileChange> = {};
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!(name in before)) result[name] = "added";
    else if (!(name in after)) result[name] = "removed";
    else result[name] = before[name] === after[name] ? "unchanged" : "modified";
  }
  return result;
}
