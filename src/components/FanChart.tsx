"use client";

import { arc } from "d3";
import type { KeyboardEvent } from "react";
import type { TreePerson } from "@/lib/types";
import { fullName, nicknames, UNION_MARK, unionsOf, type Index } from "@/lib/family";

// Sheet geometry in millimetres: the SVG viewBox is the A0 landscape printable area.
export const SHEET = { w: 1165, h: 817 };
const CX = SHEET.w / 2;
const CY = 805;
const R_HUB = 78;
const R_OUT = 560;
const FONT_BY_DEPTH = [9, 6.2, 4.9, 4.2, 3.7, 3.4];
const RING_NAMES = [
  "children",
  "grandchildren",
  "great-grandchildren",
  "great-great-grandchildren",
  "fifth generation",
];

/** A node is one union: a blood member plus one partner, with that couple's children. */
type FanNode = {
  person: TreePerson;
  partner?: TreePerson;
  mark: string;
  letter?: string;
  depth: number;
  branch: string;
  children: FanNode[];
  /** Angle this subtree needs so no label overlaps its neighbour, in radians. */
  need: number;
  x0: number;
  x1: number;
};

const fontAt = (depth: number) => FONT_BY_DEPTH[Math.min(depth, FONT_BY_DEPTH.length - 1)];

function build(index: Index, person: TreePerson, depth: number, branch: string, rIn: (d: number) => number): FanNode[] {
  const unions = unionsOf(index, person);
  const make = (
    partner: TreePerson | undefined,
    mark: string,
    letter: string | undefined,
    kids: TreePerson[],
  ): FanNode => {
    const children = kids.flatMap((c) => build(index, c, depth + 1, branch, rIn));
    const lines = partner ? 2 : 1;
    const own = (lines * fontAt(depth) * 1.15 + 3) / (rIn(depth) + 5);
    const need = Math.max(
      own,
      children.reduce((s, c) => s + c.need, 0),
    );
    return { person, partner, mark, letter, depth, branch, children, need, x0: 0, x1: 0 };
  };
  if (unions.length === 0) return [make(undefined, "", undefined, [])];
  return unions.map((u, i) =>
    // The source repeats a person as 1.8.1.a, 1.8.1.b for each partner; keep that convention.
    make(u.partner, UNION_MARK[u.type] ?? "×", unions.length > 1 ? String.fromCharCode(97 + i) : undefined, u.children),
  );
}

/** Give each subtree its share of [a0, a1]; children spread to fill their parent's wedge. */
function place(nodes: FanNode[], a0: number, a1: number) {
  const total = nodes.reduce((s, n) => s + n.need, 0) || 1;
  let a = a0;
  for (const n of nodes) {
    const span = ((a1 - a0) * n.need) / total;
    n.x0 = a;
    n.x1 = a + span;
    place(n.children, n.x0, n.x1);
    a += span;
  }
}

const flatten = (nodes: FanNode[]): FanNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);

const label = (p: TreePerson, letter?: string) =>
  `${fullName(p)}${letter ? ` (${letter})` : ""}${nicknames(p) ? ` (${nicknames(p)})` : ""}`;

interface FanChartProps {
  index: Index;
  root: [TreePerson, TreePerson];
  branches: TreePerson[];
  onSelect: (person: TreePerson) => void;
}

export default function FanChart({ index, root, branches, onSelect }: FanChartProps) {
  const [domingo, pastora] = root;
  // Ring width depends on how deep the tree goes, so measure depth first.
  const depthOf = (p: TreePerson): number => 1 + Math.max(0, ...index.childrenOf(p).map(depthOf));
  const rings = Math.max(1, ...branches.map(depthOf));
  const ringW = (R_OUT - R_HUB) / rings;
  const rIn = (depth: number) => R_HUB + (depth - 1) * ringW;

  const top = branches.flatMap((b) => build(index, b, 1, b.id, rIn));
  place(top, 0, Math.PI);
  const nodes = flatten(top);
  const shade = new Map(branches.map((b, i) => [b.id, i % 2 === 0 ? "wedge-a" : "wedge-b"]));

  const wedge = arc<{ r0: number; r1: number; a0: number; a1: number }>()
    .innerRadius((d) => d.r0)
    .outerRadius((d) => d.r1)
    .startAngle((d) => d.a0 - Math.PI / 2)
    .endAngle((d) => d.a1 - Math.PI / 2)
    .padAngle(0.0025)
    .padRadius(R_HUB);
  const hub = wedge({ r0: 0, r1: R_HUB - 5, a0: 0, a1: Math.PI });
  const key = (n: FanNode) => `${n.person.id}-${n.partner?.id ?? ""}-${n.depth}`;

  const nameProps = (p: TreePerson) => ({
    tabIndex: 0,
    role: "button",
    onClick: () => onSelect(p),
    onKeyDown: (e: KeyboardEvent) => e.key === "Enter" && onSelect(p),
  });

  return (
    <svg
      className="fan"
      viewBox={`0 0 ${SHEET.w} ${SHEET.h}`}
      role="img"
      aria-label="Descendants of Domingo Bautista and Pastora Cayabyab, drawn as a fan"
    >
      <g transform={`translate(${CX} ${CY})`}>
        {nodes.map((n) => (
          <path
            key={`w${key(n)}`}
            className={`wedge ${shade.get(n.branch)}`}
            d={
              wedge({ r0: rIn(n.depth), r1: n.children.length ? rIn(n.depth + 1) : R_OUT, a0: n.x0, a1: n.x1 }) ??
              undefined
            }
          />
        ))}
        <path className="hub" d={hub ?? undefined} />
        {RING_NAMES.slice(0, rings).map((name, i) => (
          <text key={name} className="ring-name" x={-rIn(i + 1) + 3} y={-3} fontSize={4}>
            {name}
          </text>
        ))}
      </g>

      <g className="fan-labels">
        {nodes.map((n) => {
          const a = (n.x0 + n.x1) / 2;
          const r = rIn(n.depth) + 5;
          const x = CX - r * Math.cos(a);
          const y = CY - r * Math.sin(a);
          const left = a <= Math.PI / 2;
          const deg = ((left ? a : a + Math.PI) * 180) / Math.PI;
          return (
            <g
              key={`l${key(n)}`}
              className="fan-node"
              transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(2)})`}
              fontSize={fontAt(n.depth)}
              textAnchor={left ? "end" : "start"}
            >
              <text className="fan-name" dy={n.partner ? "-0.2em" : "0.35em"} {...nameProps(n.person)}>
                {label(n.person, n.letter)}
                {n.person.deathDate && <tspan className="dead"> †</tspan>}
              </text>
              {n.partner && (
                <text className="fan-name fan-partner" dy="0.95em" {...nameProps(n.partner)}>
                  {n.mark} {label(n.partner)}
                  {n.partner.deathDate && <tspan className="dead"> †</tspan>}
                </text>
              )}
            </g>
          );
        })}
      </g>

      <g className="fan-root" transform={`translate(${CX} ${CY})`} textAnchor="middle">
        <text className="fan-name" y={-38} fontSize={FONT_BY_DEPTH[0]} {...nameProps(domingo)}>
          {fullName(domingo)}
        </text>
        <text className="fan-name" y={-24} fontSize={FONT_BY_DEPTH[0]} {...nameProps(pastora)}>
          × {fullName(pastora)}
        </text>
        <text y={-11} fontSize={3.4} className="fan-root-note">
          {branches.length} children · {nodes.filter((n) => !n.children.length).length} lines fan out above
        </text>
      </g>
    </svg>
  );
}
