"use client";

import { useMemo, useState } from "react";
import type { TreePerson } from "@/lib/types";
import {
  comparePeople,
  fullName,
  indexPeople,
  nicknames,
  reachableFrom,
  UNION_MARK,
  unionsOf,
  type Index,
} from "@/lib/family";
import FanChart from "./FanChart";
import { layoutFan } from "@/lib/fan";

interface FamilyTreeProps {
  people: TreePerson[];
  onSelectPerson: (person: TreePerson) => void;
}

type Select = (person: TreePerson) => void;

// Lineage codes of the anchor couples, as written in prisma/data.ts.
const CODES = {
  gundayao: ["C.0.1", "C.0.2"],
  florentina: ["C.1", "C.1.s"],
  carlos: ["B.0.1", "B.0.2"],
  claudio: ["B.1", "B.1.s"],
  pastora: "1.3",
  domingo: "B.1.3",
  siti: "C.U.1",
  dominga: "B.2",
  mariano: "B.3",
};

function PersonName({ person, onSelect, strong }: { person: TreePerson; onSelect: Select; strong?: boolean }) {
  const nick = nicknames(person);
  return (
    <button
      className={`person${strong ? " person-strong" : ""}`}
      data-person-id={person.id}
      type="button"
      onClick={() => onSelect(person)}
    >
      <span className="person-name">{fullName(person)}</span>
      {nick && <span className="person-nick"> ({nick})</span>}
      {person.deathDate && (
        <span className="dead" title="Deceased">
          {" "}
          †
        </span>
      )}
    </button>
  );
}

/** A compact indented list: one member per line with partner, children nested. */
function Member({ index, person, onSelect }: { index: Index; person: TreePerson; onSelect: Select }) {
  const unions = unionsOf(index, person);
  return (
    <li className="member">
      {unions.length === 0 ? (
        <div className="union">
          <PersonName person={person} onSelect={onSelect} />
        </div>
      ) : (
        unions.map((u, i) => (
          <div className="union" key={u.partner?.id ?? "unrecorded"}>
            {i === 0 ? <PersonName person={person} onSelect={onSelect} /> : <span className="union-also">also</span>}
            <span className="union-mark">{UNION_MARK[u.type] ?? "×"}</span>
            {u.partner ? (
              <PersonName person={u.partner} onSelect={onSelect} />
            ) : (
              <span className="union-unknown">partner not recorded</span>
            )}
            {u.children.length > 0 && (
              <ul className="kids">
                {u.children.map((child) => (
                  <Member key={child.id} index={index} person={child} onSelect={onSelect} />
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </li>
  );
}

/** One row of an ancestry ladder: a couple and their children, one child carried forward. */
function Rung({ index, codes, carry, onSelect }: { index: Index; codes: string[]; carry: string; onSelect: Select }) {
  const [a, b] = index.couple(codes);
  if (!a && !b) return null;
  const children = index.childrenOfCouple(a, b);
  return (
    <div className="rung">
      <p className="rung-couple">
        {a && <PersonName person={a} onSelect={onSelect} />}
        {a && b && <span className="union-mark">×</span>}
        {b && <PersonName person={b} onSelect={onSelect} />}
      </p>
      {children.length > 0 && (
        <p className="rung-children">
          {children.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ", "}
              <PersonName person={c} onSelect={onSelect} strong={c.lineageCode === carry} />
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export default function FamilyTree({ people, onSelectPerson }: FamilyTreeProps) {
  const [search, setSearch] = useState("");
  const [fit, setFit] = useState(false);
  const index = useMemo(() => indexPeople(people), [people]);

  const pastora = index.byCode.get(CODES.pastora);
  const domingo = index.byCode.get(CODES.domingo);
  const branches = useMemo(() => index.childrenOfCouple(domingo, pastora), [index, domingo, pastora]);
  const layout = useMemo(() => layoutFan(index, branches), [index, branches]);
  const parentsOf = (p: TreePerson) =>
    p.parents.map((id) => index.byId.get(id)).filter((q): q is TreePerson => Boolean(q));

  // Surname finder: which wedge each family name sits in.
  const finder = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const n of layout.nodes) {
      for (const p of [n.person, n.partner]) {
        if (!p?.lastName) continue;
        map.set(p.lastName, (map.get(p.lastName) ?? new Set()).add(n.branch));
      }
    }
    return [...map].sort(([a], [b]) => a.localeCompare(b)).map(([name, set]) => [name, [...set].sort()] as const);
  }, [layout]);

  const [florentina, marcelino] = index.couple(CODES.florentina);
  const [claudio, marcelina] = index.couple(CODES.claudio);
  const cayabyabKin = [
    ...index.childrenOfCouple(florentina, marcelino).filter((p) => p.lineageCode !== CODES.pastora),
    ...[index.byCode.get(CODES.siti)].filter((p): p is TreePerson => Boolean(p)),
  ];
  const bautistaKin = [
    ...index.childrenOfCouple(claudio, marcelina).filter((p) => p.lineageCode !== CODES.domingo),
    ...[CODES.dominga, CODES.mariano].map((c) => index.byCode.get(c)).filter((p): p is TreePerson => Boolean(p)),
  ];

  const unplaced = useMemo(() => {
    const roots = [...index.couple(CODES.gundayao), ...index.couple(CODES.carlos), index.byCode.get(CODES.siti)].filter(
      (p): p is TreePerson => Boolean(p),
    );
    const seen = reachableFrom(index, roots);
    return people.filter((p) => !seen.has(p.id)).sort(comparePeople);
  }, [index, people]);

  const query = search.trim().toLocaleLowerCase();
  const results = query
    ? people
        .filter((person) =>
          [person.firstName, person.lastName, person.nicknames, person.lineageCode]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase().includes(query)),
        )
        .slice(0, 12)
    : [];

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
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPerson(person);
                          setSearch("");
                        }}
                      >
                        {fullName(person)}
                        {person.nicknames && ` (${nicknames(person)})`}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="poster-actions">
          <button type="button" className="poster-fit-button" onClick={() => setFit((f) => !f)} aria-pressed={fit}>
            {fit ? "Actual size" : "Fit to screen"}
          </button>
          <button type="button" className="poster-print-button" onClick={() => window.print()}>
            Print / save PDF
          </button>
          <p>A0 landscape at 100%. One page.</p>
        </div>
      </div>

      <article className={`sheet${fit ? " sheet-fit" : ""}`} id="family-poster">
        {domingo && pastora && (
          <FanChart layout={layout} root={[domingo, pastora]} parentsOf={parentsOf} onSelect={onSelectPerson} />
        )}

        <header className="panel panel-title">
          <h1 id="poster-title">Our Lineage</h1>
          <p className="sheet-subtitle">The Domingo Bautista and Pastora Cayabyab Clan</p>
          <p className="sheet-meta">
            Record as of 10 December 2024, compiled by Ofelia K. Bautista with Teodora B. Dequina, Alice F. Taroy,
            Lillie V. Cruz, and Salvador C. Bautista. Read the fan from the bottom: each ring is one generation, each
            wedge one of the seven children's families. Small numbers point to the notes.
          </p>
        </header>

        <section className="panel panel-finder" aria-label="Find your family name">
          <h2>Find your family name</h2>
          <ul className="finder">
            {finder.map(([name, wedges]) => (
              <li key={name}>
                <span>{name}</span>
                <b>{wedges.join(" ")}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel-notes" aria-label="Notes">
          <h2>Notes</h2>
          <ol className="notes">
            {layout.notes.map((note, i) => (
              <li key={note.n}>
                {(i === 0 || layout.notes[i - 1].branch !== note.branch) && (
                  <span className="note-head">
                    {note.branch} · {branches[note.branch - 1]?.firstName}
                  </span>
                )}
                <b>{note.n}</b> <span className="note-name">{fullName(note.person)}.</span> {note.text}
              </li>
            ))}
          </ol>
        </section>

        <section className="panel panel-roots" aria-label="Parents and grandparents">
          <div>
            <h2>Pastora's side</h2>
            <Rung index={index} codes={CODES.gundayao} carry="C.1" onSelect={onSelectPerson} />
            <Rung index={index} codes={CODES.florentina} carry={CODES.pastora} onSelect={onSelectPerson} />
          </div>
          <div>
            <h2>Domingo's side</h2>
            <Rung index={index} codes={CODES.carlos} carry="B.1" onSelect={onSelectPerson} />
            <Rung index={index} codes={CODES.claudio} carry={CODES.domingo} onSelect={onSelectPerson} />
          </div>
        </section>

        <ul className="panel panel-key" aria-label="How to read the chart">
          <li>
            <b>×</b> married
          </li>
          <li>
            <b>&amp;</b> live-in or common-law partner
          </li>
          <li>
            <b>÷</b> divorced
          </li>
          <li>
            <b>?</b> other parent not recorded
          </li>
          <li>
            <b className="dead">†</b> deceased
          </li>
          <li>
            <b>(a) (b)</b> same person, another partner
          </li>
          <li>
            <b>(Nick)</b> known at home and to friends as
          </li>
        </ul>

        <section className="panel panel-kin panel-kin-left" aria-label="Pastora's brothers and sisters">
          <h2>Pastora's brothers and sisters</h2>
          <ul className="tree">
            {cayabyabKin.map((p) => (
              <Member key={p.id} index={index} person={p} onSelect={onSelectPerson} />
            ))}
          </ul>
        </section>

        <section className="panel panel-kin panel-kin-right" aria-label="Domingo's brothers, aunt, and uncle">
          <h2>Domingo's brothers, aunt, and uncle</h2>
          <ul className="tree">
            {bautistaKin.map((p) => (
              <Member key={p.id} index={index} person={p} onSelect={onSelectPerson} />
            ))}
            {unplaced.map((p) => (
              <li className="member" key={p.id}>
                <div className="union">
                  <PersonName person={p} onSelect={onSelectPerson} />
                  <span className="union-unknown"> relationship not recorded</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </section>
  );
}
