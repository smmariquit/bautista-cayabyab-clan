"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { TreePerson } from "@/lib/types";

interface FamilyTreeProps {
  people: TreePerson[];
  onSelectPerson: (person: TreePerson) => void;
}

interface HierarchyNode {
  person: TreePerson;
  partner?: TreePerson;
  children?: HierarchyNode[];
}

const NODE_W = 180;
const NODE_H = 56;
const PARTNER_GAP = 20;
const H_GAP = 60; // Horizontal gap between adjacent couples/nodes
const V_GAP = 100;
const LAYOUT_W = (2 * NODE_W + PARTNER_GAP) + H_GAP;

export default function FamilyTree({ people, onSelectPerson }: FamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TreePerson[]>([]);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);


  // Search filtering
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const q = search.toLowerCase();
    setSearchResults(
      people.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          (p.nicknames && p.nicknames.toLowerCase().includes(q))
      ).slice(0, 8)
    );
  }, [search, people]);

  const buildHierarchy = useCallback((): HierarchyNode | null => {
    if (people.length === 0) return null;

    const map = new Map<string, TreePerson>();
    people.forEach((p) => map.set(p.id, p));

    // Find roots (people with no parents)
    const roots = people.filter((p) => p.parents.length === 0);
    // Pick the first male root as the main ancestor, or just the first root
    const mainRoot = roots.find((r) => r.gender === "M") || roots[0];
    if (!mainRoot) return null;

    const visited = new Set<string>();

    function buildNode(person: TreePerson): HierarchyNode {
      visited.add(person.id);

      // Find partner
      const partnerInfo = person.partners[0];
      const partner = partnerInfo ? map.get(partnerInfo.id) : undefined;
      if (partner) visited.add(partner.id);

      // Find biological children (children shared between person and partner, or just person's children)
      const childIds = new Set(person.children);
      const uniqueChildren: TreePerson[] = [];
      const seenChildIds = new Set<string>();

      childIds.forEach((cid) => {
        if (!seenChildIds.has(cid) && !visited.has(cid)) {
          const child = map.get(cid);
          if (child) {
            seenChildIds.add(cid);
            uniqueChildren.push(child);
          }
        }
      });

      // Sort children by lineage code
      uniqueChildren.sort((a, b) => {
        if (a.lineageCode && b.lineageCode) return a.lineageCode.localeCompare(b.lineageCode, undefined, { numeric: true });
        return 0;
      });

      return {
        person,
        partner,
        children: uniqueChildren.length > 0 ? uniqueChildren.map((c) => buildNode(c)) : undefined,
      };
    }

    return buildNode(mainRoot);
  }, [people]);

  // Render the tree with D3
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || people.length === 0) return;

    const hierarchy = buildHierarchy();
    if (!hierarchy) return;

    const root = d3.hierarchy(hierarchy, (d) => d.children);
    const treeLayout = d3.tree<HierarchyNode>().nodeSize([LAYOUT_W, NODE_H + V_GAP]);
    treeLayout(root);

    const svgSel = d3.select(svg);
    svgSel.selectAll("g.tree-root").remove();

    const g = svgSel.append("g").attr("class", "tree-root");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svgSel.call(zoom);
    zoomRef.current = zoom;

    // Center the tree
    const bounds = svg.getBoundingClientRect();
    const initialTransform = d3.zoomIdentity
      .translate(bounds.width / 2, 80)
      .scale(0.65);
    svgSel.call(zoom.transform, initialTransform);

    // Draw links
    const links = root.links();
    g.selectAll("path.tree-link")
      .data(links)
      .join("path")
      .attr("class", "tree-link")
      .attr("d", (d) => {
        const sx = d.source.x!;
        const sy = d.source.y! + NODE_H / 2;
        const tx = d.target.x!;
        const ty = d.target.y! - NODE_H / 2;
        const my = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
      });

    // Draw node groups
    const nodeGroups = g.selectAll("g.tree-node-group")
      .data(root.descendants())
      .join("g")
      .attr("class", "tree-node-group");

    // 1. Draw main person card
    const personNodes = nodeGroups.append("g")
      .attr("class", (d) => {
        const gen = d.data.person.gender;
        return `tree-node ${gen === "M" ? "tree-node-male" : gen === "F" ? "tree-node-female" : ""}`;
      })
      .attr("transform", (d) => {
        const xOffset = d.data.partner ? PARTNER_GAP / 2 : -NODE_W / 2;
        return `translate(${d.x! + xOffset},${d.y! - NODE_H / 2})`;
      })
      .on("click", (_, d) => onSelectPerson(d.data.person));

    personNodes.append("rect")
      .attr("class", "tree-node-card")
      .attr("width", NODE_W)
      .attr("height", NODE_H);

    personNodes.append("rect")
      .attr("width", 3)
      .attr("height", NODE_H - 16)
      .attr("x", 6)
      .attr("y", 8)
      .attr("rx", 2)
      .attr("fill", (d) => d.data.person.gender === "M" ? "var(--color-male)" : d.data.person.gender === "F" ? "var(--color-female)" : "var(--color-text-muted)")
      .attr("opacity", 0.6);

    personNodes.append("text")
      .attr("class", "tree-node-name")
      .attr("x", 18)
      .attr("y", 22)
      .text((d) => {
        const p = d.data.person;
        const name = `${p.firstName} ${p.lastName}`;
        return name.length > 20 ? name.slice(0, 18) + "…" : name;
      });

    personNodes.append("text")
      .attr("class", "tree-node-info")
      .attr("x", 18)
      .attr("y", 38)
      .text((d) => {
        const p = d.data.person;
        if (p.nicknames) return `"${p.nicknames.split(",")[0]}"`;
        if (p.occupation) return p.occupation.slice(0, 25);
        return "";
      });

    personNodes.append("text")
      .attr("class", "tree-node-info")
      .attr("x", NODE_W - 8)
      .attr("y", 14)
      .attr("text-anchor", "end")
      .attr("fill", "var(--color-accent)")
      .attr("font-size", "9px")
      .text((d) => d.data.person.lineageCode || "");

    // 2. Draw partner card (only if partner exists)
    const partnerNodes = nodeGroups.filter((d) => !!d.data.partner)
      .append("g")
      .attr("class", (d) => {
        const gen = d.data.partner!.gender;
        return `tree-node ${gen === "M" ? "tree-node-male" : gen === "F" ? "tree-node-female" : ""}`;
      })
      .attr("transform", (d) => `translate(${d.x! - PARTNER_GAP / 2 - NODE_W},${d.y! - NODE_H / 2})`)
      .on("click", (_, d) => onSelectPerson(d.data.partner!));

    partnerNodes.append("rect")
      .attr("class", "tree-node-card")
      .attr("width", NODE_W)
      .attr("height", NODE_H);

    partnerNodes.append("rect")
      .attr("width", 3)
      .attr("height", NODE_H - 16)
      .attr("x", 6)
      .attr("y", 8)
      .attr("rx", 2)
      .attr("fill", (d) => d.data.partner!.gender === "M" ? "var(--color-male)" : d.data.partner!.gender === "F" ? "var(--color-female)" : "var(--color-text-muted)")
      .attr("opacity", 0.6);

    partnerNodes.append("text")
      .attr("class", "tree-node-name")
      .attr("x", 18)
      .attr("y", 22)
      .text((d) => {
        const p = d.data.partner!;
        const name = `${p.firstName} ${p.lastName}`;
        return name.length > 20 ? name.slice(0, 18) + "…" : name;
      });

    partnerNodes.append("text")
      .attr("class", "tree-node-info")
      .attr("x", 18)
      .attr("y", 38)
      .text((d) => {
        const p = d.data.partner!;
        if (p.nicknames) return `"${p.nicknames.split(",")[0]}"`;
        if (p.occupation) return p.occupation.slice(0, 25);
        return "";
      });

    // Render lineage/generation code for partner nodes too!
    partnerNodes.append("text")
      .attr("class", "tree-node-info")
      .attr("x", NODE_W - 8)
      .attr("y", 14)
      .attr("text-anchor", "end")
      .attr("fill", "var(--color-accent)")
      .attr("font-size", "9px")
      .text((d) => d.data.partner!.lineageCode || "");

    // 3. Draw connecting lines between partner and main person
    nodeGroups.filter((d) => !!d.data.partner)
      .append("line")
      .attr("class", "tree-partner-link")
      .attr("x1", (d) => d.x! - PARTNER_GAP / 2)
      .attr("y1", (d) => d.y!)
      .attr("x2", (d) => d.x! + PARTNER_GAP / 2)
      .attr("y2", (d) => d.y!);
  }, [people, buildHierarchy, onSelectPerson]);

  const handleZoom = (direction: "in" | "out" | "reset") => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    const sel = d3.select(svg);
    if (direction === "in") sel.transition().call(zoomRef.current.scaleBy, 1.3);
    else if (direction === "out") sel.transition().call(zoomRef.current.scaleBy, 0.7);
    else {
      const bounds = svg.getBoundingClientRect();
      sel.transition().call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(bounds.width / 2, 80).scale(0.65)
      );
    }
  };

  const focusOnPerson = (person: TreePerson) => {
    setSearch("");
    setSearchResults([]);
    onSelectPerson(person);
  };

  const generations = new Set(people.map((p) => p.generation));

  if (people.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <div className="loading-text">Loading family tree…</div>
      </div>
    );
  }

  return (
    <div className="tree-container">
      {/* Search */}
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search family members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="family-search"
        />
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="search-result-item"
                onClick={() => focusOnPerson(p)}
              >
                <div>
                  <div className="search-result-name">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="search-result-info">
                    {p.nicknames && `"${p.nicknames.split(",")[0]}"`}
                    {p.nicknames && p.lineageCode && " · "}
                    {p.lineageCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tree SVG */}
      <svg ref={svgRef} className="tree-svg" id="family-tree-svg" />

      {/* Zoom controls */}
      <div className="tree-controls">
        <button onClick={() => handleZoom("in")} title="Zoom in">+</button>
        <button onClick={() => handleZoom("out")} title="Zoom out">−</button>
        <button onClick={() => handleZoom("reset")} title="Reset view">⟲</button>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{people.length}</span>
          <span className="stat-label">Members</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{generations.size}</span>
          <span className="stat-label">Generations</span>
        </div>
      </div>
    </div>
  );
}
