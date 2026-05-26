"use client";

import { useEffect, useState, useCallback } from "react";
import PersonDetail from "@/components/PersonDetail";
import type { TreePerson } from "@/lib/types";

interface HierarchyNode {
  person: TreePerson;
  partner?: TreePerson;
  children?: HierarchyNode[];
}

export default function ListPage() {
  const [people, setPeople] = useState<TreePerson[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<TreePerson | null>(null);
  const [showPreface, setShowPreface] = useState(false);

  const fetchPeople = () => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then((data: TreePerson[]) => {
        setPeople(data);
        if (selectedPerson) {
          const updated = data.find((p) => p.id === selectedPerson.id);
          if (updated) setSelectedPerson(updated);
        }
      });
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const buildHierarchy = useCallback((): HierarchyNode | null => {
    if (people.length === 0) return null;

    const map = new Map<string, TreePerson>();
    people.forEach((p) => map.set(p.id, p));

    const roots = people.filter((p) => p.parents.length === 0);
    const mainRoot = roots.find((r) => r.gender === "M") || roots[0];
    if (!mainRoot) return null;

    const visited = new Set<string>();

    function buildNode(person: TreePerson): HierarchyNode {
      visited.add(person.id);

      const partnerInfo = person.partners[0];
      const partner = partnerInfo ? map.get(partnerInfo.id) : undefined;
      if (partner) visited.add(partner.id);

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

  // Flattened results for searching
  const filteredPeople = search.trim()
    ? people.filter(
        (p) =>
          p.firstName.toLowerCase().includes(search.toLowerCase()) ||
          p.lastName.toLowerCase().includes(search.toLowerCase()) ||
          (p.nicknames && p.nicknames.toLowerCase().includes(search.toLowerCase())) ||
          (p.occupation && p.occupation.toLowerCase().includes(search.toLowerCase())) ||
          (p.lineageCode && p.lineageCode.includes(search))
      )
    : [];

  const rootNode = buildHierarchy();

  // Recursive renderer for the family hierarchy tree list
  const renderHierarchy = (node: HierarchyNode, depth = 0): React.ReactNode => {
    const { person, partner, children: nodeChildren } = node;
    const genderClass = person.gender === "M" ? "text-male" : "text-female";
    
    return (
      <div key={person.id} className="hierarchy-row-container" style={{ paddingLeft: `${depth * 24}px` }}>
        <div className="hierarchy-row">
          <div className="hierarchy-content">
            <span className="hierarchy-lineage-code">{person.lineageCode || "•"}</span>
            <span 
              className={`hierarchy-name link-hover ${genderClass}`}
              onClick={() => setSelectedPerson(person)}
            >
              {person.firstName} {person.lastName}
              {person.suffix && ` ${person.suffix}`}
            </span>

            {person.nicknames && (
              <span className="hierarchy-nicknames">
                ({person.nicknames.split(",")[0]})
              </span>
            )}

            {partner && (
              <>
                <span className="hierarchy-connector">m.</span>
                <span 
                  className={`hierarchy-partner link-hover ${partner.gender === "M" ? "text-male" : "text-female"}`}
                  onClick={() => setSelectedPerson(partner)}
                >
                  {partner.firstName} {partner.lastName}
                </span>
                {partner.nicknames && (
                  <span className="hierarchy-nicknames">
                    ({partner.nicknames.split(",")[0]})
                  </span>
                )}
                {partner.lineageCode && (
                  <span className="hierarchy-partner-code">[{partner.lineageCode}]</span>
                )}
              </>
            )}

            {(person.birthDate || person.deathDate) && (
              <span className="hierarchy-years">
                * {person.birthDate || "?"} — {person.deathDate || "present"}
              </span>
            )}

            {person.occupation && (
              <span className="hierarchy-occupation">
                — {person.occupation}
              </span>
            )}
          </div>
        </div>

        {nodeChildren && nodeChildren.map((child) => renderHierarchy(child, depth + 1))}
      </div>
    );
  };

  if (people.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <div className="loading-text">Loading clan members list…</div>
      </div>
    );
  }

  return (
    <main className="list-page-container">
      <div className="list-header-section">
        <h1 className="list-title">Bautista–Cayabyab Clan Descendants</h1>
        <p className="list-desc">
          As of December 10, 2024 • A searchable, hierarchical directory of our lineage. 
          Click on any name to view their full biographical profile or edit details.
        </p>

        <button className="preface-toggle" onClick={() => setShowPreface(!showPreface)}>
          {showPreface ? "📖 Hide Preface" : "📖 Read Preface & History"}
        </button>

        {showPreface && (
          <div className="preface-card">
            <div className="preface-title">OUR LINEAGE: THE DOMINGO BAUTISTA-PASTORA CAYABYAB CLAN</div>
            <div className="preface-date">As of December 10, 2024</div>
            <div className="preface-contributors">
              <strong>Contributors:</strong> Ofelia K. Bautista (coordinator), Teodora B. Dequina, Alice F. Taroy, Lillie V. Cruz, Salvador C. Bautista
            </div>
            
            <blockquote className="preface-quote">
              "No matter how famous, influential, wealthy, or successful you are, you and I will be forgotten by the third generation... unless you are Hitler or Judas, you will be remembered for a long time. Our descendants will hardly know who we were, nor will they remember us... After we die, we will be remembered for a few more years, then we are just a portrait on someone's bookshelf, and a few more years later, our history, photos, and deeds disappear into history’s oblivion. We won't even be memories."
              <cite>— Francis J. Kong (Philippine Star)</cite>
            </blockquote>

            <p className="preface-p">
              This genealogy will at least show us who our forebears were and who our relatives are, if we care to know them. Sometimes, we meet a person who has the same family name as we have and there is a possibility that we are relatives. It would be interesting to see our connectedness. This document will then be of help.
            </p>

            <p className="preface-p">
              Nicknames are included because in Philippine culture, nicknames indicate familiarity and intimacy so other than their surnames, people are sometimes better known or only known by their nicknames, rather than by their first names. Usually, nicknames are derived from first names, but it is not uncommon that nicknames bear no resemblance to their first names. Often, their nickname at home is different from those given by their friends.
            </p>

            <p className="preface-p">
              The numbering system adopted shows the generations after Roberto Gundayao and Anacleta Junio, which means that the lineage is up to the 5th generation. And since the children of the fifth generation are not numbered, six generations are included in this list.
            </p>

            <blockquote className="preface-quote">
              "If you don't recount your family history, it might be lost. The tales may not seem important but they are what binds families and makes of us who we are."
              <cite>— Madeleine L'Engle</cite>
            </blockquote>

            <p className="preface-p">
              Most of us are ordinary folks. However, in a family, there may be luminaries and bad eggs. We are proud of our luminaries in our ancestry and let them be our inspiration. We should not be ashamed of those of us who did not do well but let them be a reminder of our being human.
            </p>

            <div className="preface-note-section">
              <h3 className="preface-note-title">📌 Note to Relatives</h3>
              <p className="preface-p">
                As of this writing, the list in the genealogy is incomplete, but with everybody’s cooperation, the list will be completed.
              </p>
              <p className="preface-p">
                Make this narrative more informative. Pictures of the family — with captions please — will spice up this genealogy.
              </p>
              <p className="preface-p">
                Then we will ask a tech-savvy relative, probably <strong>Roberto K. Bautista Jr.</strong> to help us with the family tree format, if possible. We will see if it is a better and easier way to understand the relationships. Or maybe we can use both the family tree format and the present directory list format.
              </p>
              <p className="preface-p">
                Please send your family history, pictures, dates and other information which will help me in organizing them. Feel free to make corrections and suggestions.
              </p>
              <p className="preface-p">
                We hope to convert this document into a book which everybody in the family can avail of, for the information of the present generation and the benefit of future generations.
              </p>
            </div>
          </div>
        )}
        
        <div className="list-search-wrapper" style={{ marginTop: "2rem" }}>
          <span className="list-search-icon">🔍</span>
          <input
            type="text"
            className="list-search-input"
            placeholder="Search by name, nickname, occupation, or generation number (e.g. 1.3)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="list-content-area">
        {search.trim() ? (
          // Render search results
          <div className="search-results-list">
            <h2 className="section-title">Search Results ({filteredPeople.length})</h2>
            {filteredPeople.length > 0 ? (
              <div className="results-grid">
                {filteredPeople.map((p) => (
                  <div key={p.id} className="search-card" onClick={() => setSelectedPerson(p)}>
                    <div className="search-card-left">
                      <span className={`gender-indicator ${p.gender === "M" ? "bg-male" : "bg-female"}`}>
                        {p.gender === "M" ? "♂" : "♀"}
                      </span>
                    </div>
                    <div className="search-card-body">
                      <div className="search-card-name">
                        {p.firstName} {p.lastName} {p.suffix && ` ${p.suffix}`}
                        {p.nicknames && <span className="text-accent italic font-normal ml-2">({p.nicknames.split(",")[0]})</span>}
                      </div>
                      <div className="search-card-meta">
                        {p.lineageCode && <span className="meta-badge">{p.lineageCode}</span>}
                        <span className="meta-badge">Gen {p.generation}</span>
                        {p.occupation && <span className="meta-text">{p.occupation}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">No clan members found matching "{search}"</div>
            )}
          </div>
        ) : (
          // Render full hierarchical list
          <div className="hierarchy-list-wrapper">
            <h2 className="section-title">Full Family Lineage</h2>
            <div className="hierarchy-tree-view">
              {rootNode && renderHierarchy(rootNode)}
            </div>
          </div>
        )}
      </div>

      {selectedPerson && (
        <PersonDetail
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onNavigate={(p) => setSelectedPerson(p)}
          allPeople={people}
          onPersonUpdate={fetchPeople}
        />
      )}
    </main>
  );
}
