// Graph helpers over the flat people list the tree API returns.
import type { TreePerson } from "@/lib/types";

export const UNION_MARK: Record<string, string> = {
  married: "×",
  livein: "&",
  divorced: "÷",
  unrecorded: "?",
};

export const comparePeople = (a: TreePerson, b: TreePerson) =>
  (a.lineageCode || "").localeCompare(b.lineageCode || "", undefined, { numeric: true }) ||
  `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);

export const fullName = (person: TreePerson) =>
  [person.firstName, person.lastName, person.suffix].filter(Boolean).join(" ") || "(name not recorded)";

export const nicknames = (person: TreePerson) =>
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

export type Index = ReturnType<typeof indexPeople>;

export type Union = { partner?: TreePerson; type: string; children: TreePerson[] };

/** One blood member's partnerships and the children of each; unplaced children come last. */
export function unionsOf(index: Index, person: TreePerson): Union[] {
  const kids = index.childrenOf(person);
  const placed = new Set<string>();
  const unions: Union[] = index.partnersOf(person).map(({ person: partner, type }) => {
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
