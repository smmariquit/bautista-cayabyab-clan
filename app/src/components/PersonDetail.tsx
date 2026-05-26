"use client";

import { useEffect, useState } from "react";
import type { TreePerson } from "@/lib/types";

interface PersonDetailProps {
  person: TreePerson;
  onClose: () => void;
  onNavigate: (person: TreePerson) => void;
  allPeople: TreePerson[];
}

export default function PersonDetail({ person, onClose, onNavigate, allPeople }: PersonDetailProps) {
  const [detail, setDetail] = useState(person);

  useEffect(() => {
    setDetail(person);
  }, [person]);

  const getPersonById = (id: string) => allPeople.find((p) => p.id === id);

  const partners = detail.partners.map((p) => ({
    person: getPersonById(p.id),
    type: p.type,
  })).filter((p) => p.person);

  const children = detail.children.map((id) => getPersonById(id)).filter(Boolean) as TreePerson[];
  const parents = detail.parents.map((id) => getPersonById(id)).filter(Boolean) as TreePerson[];

  const genderEmoji = detail.gender === "M" ? "👨" : detail.gender === "F" ? "👩" : "👤";

  return (
    <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel">
        <div className="detail-header">
          <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="detail-photo">
            {detail.photoUrl ? (
              <img src={detail.photoUrl} alt={detail.firstName} />
            ) : (
              genderEmoji
            )}
          </div>
          <div className="detail-name">{detail.firstName} {detail.lastName}</div>
          {detail.nicknames && (
            <div className="detail-nicknames">
              aka {detail.nicknames.split(",").map((n) => `"${n.trim()}"`).join(", ")}
            </div>
          )}
          {detail.lineageCode && (
            <span className="detail-lineage">{detail.lineageCode}</span>
          )}
        </div>

        <div className="detail-body">
          {/* Biographical Info */}
          {(detail.occupation || detail.bio || detail.birthDate) && (
            <div className="detail-section">
              <div className="detail-section-title">About</div>
              {detail.occupation && (
                <div className="detail-field">
                  <span className="detail-field-label">Occupation</span>
                  <span className="detail-field-value">{detail.occupation}</span>
                </div>
              )}
              {detail.birthDate && (
                <div className="detail-field">
                  <span className="detail-field-label">Born</span>
                  <span className="detail-field-value">{detail.birthDate}</span>
                </div>
              )}
              {detail.deathDate && (
                <div className="detail-field">
                  <span className="detail-field-label">Died</span>
                  <span className="detail-field-value">{detail.deathDate}</span>
                </div>
              )}
              {detail.bio && (
                <div className="detail-field">
                  <span className="detail-field-label">Notes</span>
                  <span className="detail-field-value">{detail.bio}</span>
                </div>
              )}
            </div>
          )}

          {/* Partners */}
          {partners.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Partner{partners.length > 1 ? "s" : ""}</div>
              <ul className="detail-relation-list">
                {partners.map(({ person: p, type }) => p && (
                  <li key={p.id} className="detail-relation-item" onClick={() => onNavigate(p)}>
                    <span className={`relation-icon ${p.gender === "M" ? "male" : "female"}`}>
                      {p.gender === "M" ? "♂" : "♀"}
                    </span>
                    <span className="relation-name">{p.firstName} {p.lastName}</span>
                    <span className="relation-type">{type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parents */}
          {parents.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Parents</div>
              <ul className="detail-relation-list">
                {parents.map((p) => (
                  <li key={p.id} className="detail-relation-item" onClick={() => onNavigate(p)}>
                    <span className={`relation-icon ${p.gender === "M" ? "male" : "female"}`}>
                      {p.gender === "M" ? "♂" : "♀"}
                    </span>
                    <span className="relation-name">{p.firstName} {p.lastName}</span>
                    <span className="relation-type">parent</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Children ({children.length})</div>
              <ul className="detail-relation-list">
                {children.map((c) => (
                  <li key={c.id} className="detail-relation-item" onClick={() => onNavigate(c)}>
                    <span className={`relation-icon ${c.gender === "M" ? "male" : "female"}`}>
                      {c.gender === "M" ? "♂" : "♀"}
                    </span>
                    <span className="relation-name">{c.firstName} {c.lastName}</span>
                    {c.nicknames && <span className="relation-type">{c.nicknames.split(",")[0]}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generation */}
          <div className="detail-section">
            <div className="detail-section-title">Generation</div>
            <span className={`gen-badge gen-${Math.min(detail.generation, 4)}`}>
              Generation {detail.generation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
