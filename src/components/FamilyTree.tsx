"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { TreePerson } from "@/lib/types";

interface FamilyTreeProps {
  people: TreePerson[];
  onSelectPerson: (person: TreePerson) => void;
}

type Select = (person: TreePerson) => void;

// Lineage codes of the anchor couples, as written in prisma/seed.ts.
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

const UNION_MARK: Record<string, string> = {
  married: "×",
  livein: "&",
  divorced: "× div.",
  unrecorded: "?",
};

export const comparePeople = (a: TreePerson, b: TreePerson) =>
  (a.lineageCode || "").localeCompare(b.lineageCode || "", undefined, { numeric: true }) ||
  `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);

export const fullName = (person: TreePerson) =>
  [person.firstName, person.lastName, person.suffix].filter(Boolean).join(" ") || "(name not recorded)";

const nicknames = (person: TreePerson) =>
  person.nicknames
    ? person.nicknames
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .join(" / ")
    : "";

/** Index of the family graph keyed every way the poster needs. */
export function indexPeople(people: TreePerson[]) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const byCode = new Map(people.filter((p) => p.lineageCode).map((p) => [p.lineageCode as string, p]));
  const childrenOf = (person: TreePerson) =>
    person.children
      .map((id) => byId.get(id))
      .filter((c): c is TreePerson => Boolean(c))
      .sort(comparePeople);
  const partnersOf = (person: TreePerson) =>
    person.partners
      .map((pp) => ({ person: byId.get(pp.id), type: pp.type }))
      .filter((pp): pp is { person: TreePerson; type: string } => Boolean(pp.person));
  const childrenOfCouple = (a: TreePerson | undefined, b: TreePerson | undefined) =>
    a && b ? childrenOf(a).filter((c) => c.parents.includes(b.id)) : a ? childrenOf(a) : [];
  const couple = (codes: string[]) => codes.map((c) => byCode.get(c));
  return { byId, byCode, childrenOf, partnersOf, childrenOfCouple, couple };
}

type Index = ReturnType<typeof indexPeople>;

/** One blood member with every partnership and the children of each. */
export function unionsOf(index: Index, person: TreePerson) {
  const kids = index.childrenOf(person);
  const placed = new Set<string>();
  const unions: { partner?: TreePerson; type: string; children: TreePerson[] }[] = index
    .partnersOf(person)
    .map(({ person: partner, type }) => {
      const children = kids.filter((c) => c.parents.includes(partner.id));
      children.forEach((c) => placed.add(c.id));
      return { partner, type, children };
    });
  const leftover = kids.filter((c) => !placed.has(c.id));
  if (leftover.length) unions.push({ type: "unrecorded", children: leftover });
  return unions;
}

/** Everyone reachable from a set of roots through children and partners. */
export function reachableFrom(index: Index, roots: TreePerson[]) {
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length) {
    const p = stack.pop()!;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    stack.push(...index.childrenOf(p), ...index.partnersOf(p).map((pp) => pp.person));
  }
  return seen;
}

const subtreeSize = (index: Index, person: TreePerson): number =>
  1 +
  unionsOf(index, person).reduce(
    (n, u) => n + (u.partner ? 1 : 0) + u.children.reduce((m, c) => m + subtreeSize(index, c), 0),
    0,
  );

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
        <span className="person-dagger" title="Deceased">
          {" "}
          †
        </span>
      )}
    </button>
  );
}

const firstNick = (person: TreePerson) => nicknames(person).split(" / ")[0] || person.firstName;

/** Occupation line under a couple. Labels each note with a name once both partners have one. */
function Detail({ people }: { people: (TreePerson | undefined)[] }) {
  const noted = people.filter((p): p is TreePerson => Boolean(p?.occupation));
  if (noted.length === 0) return null;
  const label = noted.length > 1 || noted[0] !== people[0];
  return (
    <span className="person-detail">
      {noted.map((p, i) => (
        <span key={p.id}>
          {i > 0 && " · "}
          {label && <b>{firstNick(p)}: </b>}
          {p.occupation}
        </span>
      ))}
    </span>
  );
}

/**
 * One blood member with every partnership and the children of each.
 * `lead` (a branch heading) is kept in one unbreakable block with the first couple line,
 * so a column break can never strand a heading from its family.
 */
function Member({
  index,
  person,
  onSelect,
  lead,
}: {
  index: Index;
  person: TreePerson;
  onSelect: Select;
  lead?: ReactNode;
}) {
  const unions = unionsOf(index, person);
  const compact = subtreeSize(index, person) <= 9;
  const withLead = (line: ReactNode) =>
    lead ? (
      <div className="branch-top">
        {lead}
        {line}
      </div>
    ) : (
      line
    );
  return (
    <li className={`member${compact ? " member-compact" : ""}`}>
      {unions.length === 0 ? (
        <div className="union">
          {withLead(
            <div className="union-line">
              <PersonName person={person} onSelect={onSelect} />
              <Detail people={[person]} />
            </div>,
          )}
        </div>
      ) : (
        unions.map((u, i) => (
          <div className={`union${i > 0 ? " union-again" : ""}`} key={u.partner?.id ?? "unrecorded"}>
            {(i === 0 ? withLead : (line: ReactNode) => line)(
              <div className="union-line">
                {i === 0 ? (
                  <PersonName person={person} onSelect={onSelect} />
                ) : (
                  <span className="union-also">also</span>
                )}
                <span className="union-mark">{UNION_MARK[u.type] ?? "×"}</span>
                {u.partner ? (
                  <PersonName person={u.partner} onSelect={onSelect} />
                ) : (
                  <span className="union-unknown">partner not recorded</span>
                )}
                <Detail people={[i === 0 ? person : undefined, u.partner]} />
              </div>,
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

/** One row of the ancestry ladder: a couple and their children, one child carried forward. */
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
  const index = useMemo(() => indexPeople(people), [people]);

  const pastora = index.byCode.get(CODES.pastora);
  const domingo = index.byCode.get(CODES.domingo);
  const branches = useMemo(() => index.childrenOfCouple(domingo, pastora), [index, domingo, pastora]);

  const [florentina, marcelino] = index.couple(CODES.florentina);
  const [claudio, marcelina] = index.couple(CODES.claudio);
  const cayabyabCousins = [
    ...index.childrenOfCouple(florentina, marcelino).filter((p) => p.lineageCode !== CODES.pastora),
    ...[index.byCode.get(CODES.siti)].filter((p): p is TreePerson => Boolean(p)),
  ];
  const bautistaCousins = [
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

  const generations = Math.max(0, ...people.map((p) => p.generation));
  const deceased = people.filter((p) => p.deathDate).length;

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
          <button type="button" className="poster-print-button" onClick={() => window.print()}>
            Print / save PDF
          </button>
          <p>Set the printer to A0 landscape at 100%. Smaller sheets scale down cleanly to A1.</p>
        </div>
      </div>

      <article className="poster" id="family-poster">
        <header className="poster-head">
          <div className="poster-title-block">
            <h1 id="poster-title">Our Lineage</h1>
            <p className="poster-subtitle">The Domingo Bautista and Pastora Cayabyab Clan</p>
          </div>
          <dl className="poster-facts">
            <div>
              <dt>Record as of</dt>
              <dd>10 December 2024</dd>
            </div>
            <div>
              <dt>People named</dt>
              <dd>{people.length}</dd>
            </div>
            <div>
              <dt>Generations</dt>
              <dd>{generations + 1}</dd>
            </div>
            <div>
              <dt>Remembered</dt>
              <dd>{deceased} †</dd>
            </div>
          </dl>
          <ul className="poster-key" aria-label="How to read the chart">
            <li>
              <b>×</b> married
            </li>
            <li>
              <b>&amp;</b> live-in or common-law partner
            </li>
            <li>
              <b>× div.</b> divorced
            </li>
            <li>
              <b>?</b> other parent not recorded
            </li>
            <li>
              <b>†</b> deceased
            </li>
            <li>
              <b>(name)</b> known to family and friends as
            </li>
          </ul>
        </header>

        <section className="ascent" aria-label="Ancestry of Domingo Bautista and Pastora Cayabyab">
          <div className="ascent-side">
            <h2>The Cayabyab line</h2>
            <Rung index={index} codes={CODES.gundayao} carry="C.1" onSelect={onSelectPerson} />
            <Rung index={index} codes={CODES.florentina} carry={CODES.pastora} onSelect={onSelectPerson} />
          </div>
          <div className="ascent-union">
            {domingo && <PersonName person={domingo} onSelect={onSelectPerson} strong />}
            <span className="ascent-mark">×</span>
            {pastora && <PersonName person={pastora} onSelect={onSelectPerson} strong />}
            <p className="ascent-note">Their seven children head the seven branches below.</p>
          </div>
          <div className="ascent-side ascent-side-right">
            <h2>The Bautista line</h2>
            <Rung index={index} codes={CODES.carlos} carry="B.1" onSelect={onSelectPerson} />
            <Rung index={index} codes={CODES.claudio} carry={CODES.domingo} onSelect={onSelectPerson} />
          </div>
        </section>

        <div className="branches">
          {branches.map((head, i) => (
            <section className="branch" key={head.id} aria-labelledby={`branch-${head.id}`}>
              <ul className="tree">
                <Member
                  index={index}
                  person={head}
                  onSelect={onSelectPerson}
                  lead={
                    <h2 id={`branch-${head.id}`} className="branch-head">
                      <span className="branch-order">{i + 1}</span>
                      {head.firstName} {nicknames(head) && <span className="branch-nick">({nicknames(head)})</span>}
                    </h2>
                  }
                />
              </ul>
            </section>
          ))}
        </div>

        <section className="cousins" aria-label="Wider family">
          <div className="cousins-group">
            <h2>Pastora's brothers and sisters</h2>
            <ul className="tree tree-compact">
              {cayabyabCousins.map((p) => (
                <Member key={p.id} index={index} person={p} onSelect={onSelectPerson} />
              ))}
            </ul>
          </div>
          <div className="cousins-group">
            <h2>Domingo's brothers, aunt, and uncle</h2>
            <ul className="tree tree-compact">
              {bautistaCousins.map((p) => (
                <Member key={p.id} index={index} person={p} onSelect={onSelectPerson} />
              ))}
            </ul>
          </div>
          {unplaced.length > 0 && (
            <div className="cousins-group">
              <h2>Named, relationship not recorded</h2>
              <ul className="tree tree-compact">
                {unplaced.map((p) => (
                  <li className="member" key={p.id}>
                    <div className="union">
                      <PersonName person={p} onSelect={onSelectPerson} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <footer className="poster-foot">
          <p>
            Compiled by Ofelia K. Bautista with Teodora B. Dequina, Alice F. Taroy, Lillie V. Cruz, and Salvador C.
            Bautista. Numbering, nicknames, and notes follow their record; blanks are blanks in the source.
          </p>
          <p>“If you don't recount your family history, it might be lost.” Madeleine L'Engle</p>
        </footer>
      </article>
    </section>
  );
}
