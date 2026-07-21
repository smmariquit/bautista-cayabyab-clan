"use client";

import { useMemo, useState } from "react";
import type { TreePerson } from "@/lib/types";

interface FamilyTreeProps {
  people: TreePerson[];
  onSelectPerson: (person: TreePerson) => void;
}

interface FamilyUnit {
  key: string;
  adults: TreePerson[];
  children: TreePerson[];
  type: string;
}

const comparePeople = (a: TreePerson, b: TreePerson) =>
  (a.lineageCode || "").localeCompare(b.lineageCode || "", undefined, { numeric: true }) ||
  `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);

const fullName = (person: TreePerson) =>
  [person.firstName, person.lastName, person.suffix].filter(Boolean).join(" ");

function PersonName({ person, onSelect }: { person: TreePerson; onSelect: (person: TreePerson) => void }) {
  return (
    <button className="poster-person" data-person-id={person.id} type="button" onClick={() => onSelect(person)}>
      <span className="poster-person-name">{fullName(person)}</span>
      {person.nicknames && (
        <span className="poster-nickname"> ({person.nicknames.split(",").join(" / ")})</span>
      )}
    </button>
  );
}

function buildFamilyUnits(people: TreePerson[]) {
  const byId = new Map(people.map((person) => [person.id, person]));
  const units: FamilyUnit[] = [];
  const seenPartnerships = new Set<string>();
  const assignedChildren = new Set<string>();
  const represented = new Set<string>();

  for (const person of people) {
    for (const partnership of person.partners) {
      const partner = byId.get(partnership.id);
      if (!partner) continue;

      const key = [person.id, partner.id].sort().join(":");
      if (seenPartnerships.has(key)) continue;
      seenPartnerships.add(key);

      const adults = [person, partner].sort(comparePeople);
      const children = people
        .filter((child) => child.parents.includes(person.id) && child.parents.includes(partner.id))
        .sort(comparePeople);

      adults.forEach((adult) => represented.add(adult.id));
      children.forEach((child) => {
        assignedChildren.add(child.id);
        represented.add(child.id);
      });
      units.push({ key, adults, children, type: partnership.type });
    }
  }

  for (const person of people) {
    const children = person.children
      .filter((childId) => !assignedChildren.has(childId))
      .map((childId) => byId.get(childId))
      .filter((child): child is TreePerson => Boolean(child))
      .sort(comparePeople);

    if (children.length === 0) continue;
    represented.add(person.id);
    children.forEach((child) => represented.add(child.id));
    units.push({ key: `single:${person.id}`, adults: [person], children, type: "unrecorded" });
  }

  units.sort((a, b) => {
    const generation = Math.min(...a.adults.map((person) => person.generation)) - Math.min(...b.adults.map((person) => person.generation));
    return generation || comparePeople(a.adults[0], b.adults[0]);
  });

  return {
    units,
    unplaced: people.filter((person) => !represented.has(person.id)).sort(comparePeople),
  };
}

export default function FamilyTree({ people, onSelectPerson }: FamilyTreeProps) {
  const [search, setSearch] = useState("");
  const { units, unplaced } = useMemo(() => buildFamilyUnits(people), [people]);
  const query = search.trim().toLocaleLowerCase();
  const results = query
    ? people.filter((person) =>
        [person.firstName, person.lastName, person.nicknames, person.lineageCode]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(query)),
      ).slice(0, 12)
    : [];
  const generationCount = Math.max(0, ...people.map((person) => person.generation));

  if (people.length === 0) {
    return (
      <div className="loading" role="status">
        <p className="loading-text">No family members were found.</p>
        <p>Check that the family database has been seeded.</p>
      </div>
    );
  }

  return (
    <section className="poster-page" aria-labelledby="poster-title">
      <div className="poster-toolbar" aria-label="Family tree tools">
        <div className="poster-search">
          <label htmlFor="family-search">Find a family member</label>
          <input
            id="family-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
            aria-describedby="search-help"
          />
          <span id="search-help">Search by name, nickname, or lineage number.</span>
          {query && (
            <div className="poster-search-results" aria-live="polite">
              <p>{results.length ? `${results.length} matching people` : "No matching people"}</p>
              {results.length > 0 && (
                <ul>
                  {results.map((person) => (
                    <li key={person.id}>
                      <button type="button" onClick={() => { onSelectPerson(person); setSearch(""); }}>
                        {fullName(person)}
                        {person.nicknames && ` (${person.nicknames.split(",").join(" / ")})`}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="poster-actions">
          <button type="button" className="poster-print-button" onClick={() => window.print()}>
            Print / save PDF
          </button>
          <p>A0 landscape at 100% scale gives the clearest wall poster.</p>
        </div>
      </div>

      <div className="family-poster" id="family-poster">
        <header className="poster-heading">
          <p className="poster-kicker">The Domingo Bautista–Pastora Cayabyab Clan</p>
          <h1 id="poster-title">Our Lineage</h1>
          <p className="poster-date">Family record as of December 10, 2024</p>
          <div className="poster-summary" aria-label="Family tree summary">
            <span><strong>{people.length}</strong> people named in the scan</span>
            <span><strong>{generationCount}</strong> generations after the founding couples</span>
            <span><strong>{units.length}</strong> family groups</span>
          </div>
        </header>

        <aside className="poster-key" aria-label="Relationship key">
          <span><strong>×</strong> married</span>
          <span><strong>Partner</strong> live-in or common-law partner</span>
          <span><strong>Divorced</strong> divorced</span>
          <span><strong>Children</strong> listed directly below their parents</span>
        </aside>

        <div className="poster-units" aria-label="Family groups">
          {units.map((unit) => {
            const generation = Math.min(...unit.adults.map((person) => person.generation));
            const connector = unit.type === "married" ? "×" : unit.type === "divorced" ? "Divorced" : unit.type === "livein" ? "Partner" : "Other parent not recorded";

            return (
              <article className={`family-unit generation-${generation}`} key={unit.key}>
                <p className="family-unit-meta">
                  {generation === 0 ? "Founding couple" : `Generation ${generation}`}
                  {unit.adults[0].lineageCode && ` · ${unit.adults[0].lineageCode}`}
                </p>
                <h2>
                  <PersonName person={unit.adults[0]} onSelect={onSelectPerson} />
                  <span className="family-connector">{connector}</span>
                  {unit.adults[1] && <PersonName person={unit.adults[1]} onSelect={onSelectPerson} />}
                </h2>
                {unit.children.length > 0 && (
                  <div className="family-children">
                    <strong>Children</strong>
                    <ul>
                      {unit.children.map((child) => (
                        <li key={child.id}><PersonName person={child} onSelect={onSelectPerson} /></li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}

          {unplaced.length > 0 && (
            <article className="family-unit family-unit-unplaced">
              <p className="family-unit-meta">Named in the source; relationship not recorded</p>
              <h2>Unplaced relatives</h2>
              <ul className="unplaced-people">
                {unplaced.map((person) => (
                  <li key={person.id}><PersonName person={person} onSelect={onSelectPerson} /></li>
                ))}
              </ul>
            </article>
          )}
        </div>

        <footer className="poster-footer">
          <p>Compiled by Ofelia K. Bautista, Teodora B. Dequina, Alice F. Taroy, Lillie V. Cruz, and Salvador C. Bautista.</p>
          <p>Names with an unknown surname are printed exactly as recorded in the source.</p>
        </footer>
      </div>
    </section>
  );
}
