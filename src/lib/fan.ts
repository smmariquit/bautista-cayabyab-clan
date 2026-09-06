// Layout for the descendant fan: one node per union, angles sized to the room each label needs.
import type { TreePerson } from "@/lib/types";
import { fullName, nicknames, UNION_MARK, unionsOf, type Index } from "@/lib/family";

/** Sheet geometry in millimetres: A0 landscape inside 12mm margins. */
export const SHEET = { w: 1165, h: 817 };
export const CX = SHEET.w / 2;
export const CY = 808;
export const R_HUB = 78;
export const R_OUT = 570;
/** Base label sizes by ring (mm); the auto-fit scales them until the half circle is full. */
const BASE_FONT = [9, 6.2, 4.9, 4.2, 3.7, 3.4];
const LINE_HEIGHT = 1.1;
const PAD = 2;
const MAX_SCALE = 1.35;
/** Average glyph width of Public Sans bold, in em, and the clearance kept before the next ring. */
const CHAR_EM = 0.62;
const RADIAL_CLEARANCE = 12;

export type FanNode = {
  person: TreePerson;
  partner?: TreePerson;
  mark: string;
  letter?: string;
  depth: number;
  branch: number;
  children: FanNode[];
  /** Label size in mm, capped by both the angle available and the ring's depth. */
  font: number;
  need: number;
  x0: number;
  x1: number;
};

export type Note = { n: number; person: TreePerson; branch: number; text: string };

export type FanLayout = {
  nodes: FanNode[];
  top: FanNode[];
  rings: number;
  scale: number;
  fontAt: (depth: number) => number;
  rIn: (depth: number) => number;
  notes: Note[];
  noteOf: Map<string, number>;
};

export const labelOf = (p: TreePerson, letter?: string) =>
  `${fullName(p)}${letter ? ` (${letter})` : ""}${nicknames(p) ? ` (${nicknames(p)})` : ""}`;

/** Characters a label line takes on the fan, superscript and dagger included. */
const labelChars = (p: TreePerson, letter?: string) =>
  labelOf(p, letter).length + (p.deathDate ? 2 : 0) + (noteText(p) ? 3 : 0);

/** The footnote text for a person, or empty. Mirrors the source's per-family footnotes. */
export const noteText = (p: TreePerson) =>
  [p.occupation, p.education, p.bio]
    .filter((s): s is string => Boolean(s))
    .join(". ")
    .replace(/\.\./g, ".");

export function layoutFan(index: Index, branches: TreePerson[]): FanLayout {
  const depthOf = (p: TreePerson): number => 1 + Math.max(0, ...index.childrenOf(p).map(depthOf));
  const rings = Math.max(1, ...branches.map(depthOf));
  const ringW = (R_OUT - R_HUB) / rings;
  const rIn = (depth: number) => R_HUB + (depth - 1) * ringW;
  const fontFor = (scale: number) => (depth: number) => BASE_FONT[Math.min(depth, BASE_FONT.length - 1)] * scale;

  const build = (person: TreePerson, depth: number, branch: number, font: (d: number) => number): FanNode[] => {
    const unions = unionsOf(index, person);
    const make = (partner: TreePerson | undefined, mark: string, letter: string | undefined, kids: TreePerson[]) => {
      const children = kids.flatMap((c) => build(c, depth + 1, branch, font));
      const chars = Math.max(labelChars(person, letter), partner ? labelChars(partner) + 2 : 0);
      const size = Math.min(font(depth), (ringW - RADIAL_CLEARANCE) / (CHAR_EM * chars));
      const own = ((partner ? 2 : 1) * size * LINE_HEIGHT + PAD) / (rIn(depth) + 5);
      const need = Math.max(
        own,
        children.reduce((s, c) => s + c.need, 0),
      );
      return { person, partner, mark, letter, depth, branch, children, font: size, need, x0: 0, x1: 0 };
    };
    if (unions.length === 0) return [make(undefined, "", undefined, [])];
    // The source repeats a person as 1.8.1.a, 1.8.1.b for each partner; keep that convention.
    return unions.map((u, i) =>
      make(
        u.partner,
        UNION_MARK[u.type] ?? "×",
        unions.length > 1 ? String.fromCharCode(97 + i) : undefined,
        u.children,
      ),
    );
  };
  const topFor = (scale: number) => branches.flatMap((b, i) => build(b, 1, i + 1, fontFor(scale)));
  const total = (top: FanNode[]) => top.reduce((s, n) => s + n.need, 0);

  // Largest scale at which every label still has its own angle.
  let lo = 0.5;
  let hi = MAX_SCALE;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (total(topFor(mid)) <= Math.PI * 0.97) lo = mid;
    else hi = mid;
  }
  const scale = lo;
  const top = topFor(scale);

  const place = (nodes: FanNode[], a0: number, a1: number) => {
    const sum = total(nodes) || 1;
    let a = a0;
    for (const n of nodes) {
      const span = ((a1 - a0) * n.need) / sum;
      n.x0 = a;
      n.x1 = a + span;
      place(n.children, n.x0, n.x1);
      a += span;
    }
  };
  place(top, 0, Math.PI);

  const flatten = (nodes: FanNode[]): FanNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);
  const nodes = flatten(top);

  // Footnotes numbered in reading order around the fan, each person once.
  const notes: Note[] = [];
  const noteOf = new Map<string, number>();
  for (const n of nodes) {
    for (const p of [n.person, n.partner]) {
      if (!p || noteOf.has(p.id)) continue;
      const text = noteText(p);
      if (!text) continue;
      noteOf.set(p.id, notes.length + 1);
      notes.push({ n: notes.length + 1, person: p, branch: n.branch, text });
    }
  }

  return { nodes, top, rings, scale, fontAt: fontFor(scale), rIn, notes, noteOf };
}
