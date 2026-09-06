"use client";

import { arc } from "d3";
import type { KeyboardEvent } from "react";
import type { TreePerson } from "@/lib/types";
import { fullName } from "@/lib/family";
import { CX, CY, labelOf as label, R_HUB, R_OUT, SHEET, type FanLayout, type FanNode } from "@/lib/fan";

const RING_NAMES = [
  "children",
  "grandchildren",
  "great-grandchildren",
  "great-great-grandchildren",
  "fifth generation",
];

interface FanChartProps {
  layout: FanLayout;
  root: [TreePerson, TreePerson];
  parentsOf: (p: TreePerson) => TreePerson[];
  onSelect: (person: TreePerson) => void;
}

export default function FanChart({ layout, root, parentsOf, onSelect }: FanChartProps) {
  const { nodes, top, rings, rIn, noteOf } = layout;
  const [domingo, pastora] = root;

  const wedge = arc<{ r0: number; r1: number; a0: number; a1: number }>()
    .innerRadius((d) => d.r0)
    .outerRadius((d) => d.r1)
    .startAngle((d) => d.a0 - Math.PI / 2)
    .endAngle((d) => d.a1 - Math.PI / 2)
    .padAngle(0.0025)
    .padRadius(R_HUB);
  const hub = wedge({ r0: 0, r1: R_HUB - 5, a0: 0, a1: Math.PI });
  const semicircle = (r: number) => `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`;
  const key = (n: FanNode) => `${n.person.id}-${n.partner?.id ?? ""}-${n.depth}`;

  const nameProps = (p: TreePerson) => ({
    tabIndex: 0,
    role: "button",
    onClick: () => onSelect(p),
    onKeyDown: (e: KeyboardEvent) => e.key === "Enter" && onSelect(p),
  });
  const marks = (p: TreePerson) => (
    <>
      {p.deathDate && <tspan className="dead"> †</tspan>}
      {noteOf.has(p.id) && (
        <tspan className="note-ref" baselineShift="super" fontSize="65%">
          {noteOf.get(p.id)}
        </tspan>
      )}
    </>
  );
  const lineage = (p: TreePerson, word: string) => {
    const parents = parentsOf(p);
    return parents.length ? `${p.firstName}, ${word} of ${parents.map(fullName).join(" and ")}` : "";
  };

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
            className={`wedge ${n.branch % 2 ? "wedge-a" : "wedge-b"}`}
            d={
              wedge({ r0: rIn(n.depth), r1: n.children.length ? rIn(n.depth + 1) : R_OUT, a0: n.x0, a1: n.x1 }) ??
              undefined
            }
          />
        ))}
        {Array.from({ length: rings - 1 }, (_, i) => (
          <path key={`ring${i}`} className="ring-line" d={semicircle(rIn(i + 2))} />
        ))}
        <path className="hub" d={hub ?? undefined} />
        {RING_NAMES.slice(0, rings).map((name, i) => (
          <g key={name}>
            <line className="ring-tick" x1={-rIn(i + 1)} x2={-rIn(i + 1)} y1={0} y2={7.5} />
            <text className="ring-name" x={-rIn(i + 1) - 2} y={6.8} fontSize={4.4} textAnchor="end">
              {name}
            </text>
          </g>
        ))}
        {[...new Set(top.map((n) => n.branch))].map((branch) => {
          const span = top.filter((n) => n.branch === branch);
          const a = (span[0].x0 + span[span.length - 1].x1) / 2;
          const r = R_OUT + 4;
          return (
            <text
              key={`b${branch}`}
              className="branch-numeral"
              x={-r * Math.cos(a)}
              y={-r * Math.sin(a)}
              fontSize={16}
              textAnchor={a < Math.PI / 2 - 0.05 ? "end" : a > Math.PI / 2 + 0.05 ? "start" : "middle"}
              dominantBaseline={a > 1.2 && a < 1.94 ? "auto" : "middle"}
            >
              {branch}
            </text>
          );
        })}
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
              fontSize={n.font.toFixed(2)}
              textAnchor={left ? "end" : "start"}
            >
              <text className="fan-name" dy={n.partner ? "-0.18em" : "0.35em"} {...nameProps(n.person)}>
                {label(n.person, n.letter)}
                {marks(n.person)}
              </text>
              {n.partner && (
                <text className="fan-name fan-partner" dy="0.92em" {...nameProps(n.partner)}>
                  {n.mark} {label(n.partner)}
                  {marks(n.partner)}
                </text>
              )}
            </g>
          );
        })}
      </g>

      <g className="fan-root" transform={`translate(${CX} ${CY})`} textAnchor="middle">
        <text className="fan-name" y={-52} fontSize={8.5} {...nameProps(domingo)}>
          {fullName(domingo)}
        </text>
        <text className="fan-name" y={-40} fontSize={8.5} {...nameProps(pastora)}>
          × {fullName(pastora)}
        </text>
        <text y={-30} fontSize={3} className="fan-root-note">
          {lineage(domingo, "son")}
        </text>
        <text y={-25} fontSize={3} className="fan-root-note">
          {lineage(pastora, "daughter")}
        </text>
        <text y={-15} fontSize={3.4} className="fan-root-note">
          {new Set(top.map((n) => n.branch)).size} children, {nodes.filter((n) => !n.children.length).length} lines fan
          out above
        </text>
        <text y={-7} fontSize={3} className="fan-root-quote">
          “If you don't recount your family history, it might be lost.” Madeleine L'Engle
        </text>
      </g>
    </svg>
  );
}
