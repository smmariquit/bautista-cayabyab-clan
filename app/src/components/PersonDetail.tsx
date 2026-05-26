"use client";

import { useEffect, useState } from "react";
import type { TreePerson } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

interface PersonDetailProps {
  person: TreePerson;
  onClose: () => void;
  onNavigate: (person: TreePerson) => void;
  allPeople: TreePerson[];
  onPersonUpdate?: () => void;
}

export default function PersonDetail({
  person,
  onClose,
  onNavigate,
  allPeople,
  onPersonUpdate,
}: PersonDetailProps) {
  const { isAuthenticated } = useAuth();
  
  const [detail, setDetail] = useState(person);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nicknames, setNicknames] = useState("");
  const [suffix, setSuffix] = useState("");
  const [gender, setGender] = useState("M");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Sync state with selected person
  useEffect(() => {
    setDetail(person);
    setIsEditing(false);
    setErrorMsg("");
  }, [person]);

  // Sync form inputs with details when entering edit mode
  useEffect(() => {
    setFirstName(detail.firstName || "");
    setLastName(detail.lastName || "");
    setNicknames(detail.nicknames || "");
    setSuffix(detail.suffix || "");
    setGender(detail.gender || "M");
    setBirthDate(detail.birthDate || "");
    setDeathDate(detail.deathDate || "");
    setOccupation(detail.occupation || "");
    setBio(detail.bio || "");
    setPhotoUrl(detail.photoUrl || "");
  }, [detail, isEditing]);

  const getPersonById = (id: string) => allPeople.find((p) => p.id === id);

  const partners = detail.partners.map((p) => ({
    person: getPersonById(p.id),
    type: p.type,
  })).filter((p) => p.person);

  const children = detail.children.map((id) => getPersonById(id)).filter(Boolean) as TreePerson[];
  const parents = detail.parents.map((id) => getPersonById(id)).filter(Boolean) as TreePerson[];

  const genderEmoji = detail.gender === "M" ? "👨" : detail.gender === "F" ? "👩" : "👤";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      firstName,
      lastName,
      nicknames: nicknames || null,
      suffix: suffix || null,
      gender,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      occupation: occupation || null,
      bio: bio || null,
      photoUrl: photoUrl || null,
    };

    try {
      const res = await fetch(`/api/people/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save updates");
      }

      const updatedPerson = await res.json();
      
      // Update detail display
      setDetail({
        ...detail,
        ...updatedPerson,
      });
      setIsEditing(false);

      if (onPersonUpdate) {
        onPersonUpdate(); // Trigger parent reload
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel">
        
        {/* Toggle Editor Controls (Authenticated Only) */}
        <div className="detail-header">
          <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
          
          {!isEditing ? (
            <>
              <div className="detail-photo">
                {detail.photoUrl ? (
                  <img src={detail.photoUrl} alt={detail.firstName} />
                ) : (
                  genderEmoji
                )}
              </div>
              <div className="detail-name">
                {detail.firstName} {detail.lastName} {detail.suffix && ` ${detail.suffix}`}
              </div>
              {detail.nicknames && (
                <div className="detail-nicknames">
                  aka {detail.nicknames.split(",").map((n) => `"${n.trim()}"`).join(", ")}
                </div>
              )}
              {detail.lineageCode && (
                <span className="detail-lineage">{detail.lineageCode}</span>
              )}
              
              {isAuthenticated && (
                <div className="detail-edit-actions">
                  <button className="btn-edit-secondary" onClick={() => setIsEditing(true)}>
                    ✏️ Edit Details
                  </button>
                </div>
              )}
            </>
          ) : (
            <h3 className="modal-title" style={{ marginTop: "12px" }}>Edit Profile</h3>
          )}
        </div>

        <div className="detail-body">
          {isEditing ? (
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nicknames</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bobby, Rob"
                    value={nicknames}
                    onChange={(e) => setNicknames(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Suffix</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jr., III"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="M">Male (♂)</option>
                    <option value="F">Female (♀)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Photo URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="/photos/image.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Birth Date</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1945 or Dec 15, 1945"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Death Date (if deceased)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2012 or Leave empty"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Occupation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Agriculturalist"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notes / Bio</label>
                <textarea
                  className="form-textarea"
                  placeholder="Additional biographical notes..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {errorMsg && <div className="form-error">{errorMsg}</div>}

              <div className="detail-edit-actions">
                <button type="submit" className="form-submit-btn" style={{ margin: 0 }} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn-edit-secondary"
                  style={{ flex: "0 0 100px" }}
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
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
                        {c.nicknames && <span className="relation-type">"{c.nicknames.split(",")[0]}"</span>}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
