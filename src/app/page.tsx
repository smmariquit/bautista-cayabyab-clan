"use client";

import { useState, useEffect } from "react";
import FamilyTree from "@/components/FamilyTree";
import PersonDetail from "@/components/PersonDetail";
import type { TreePerson } from "@/lib/types";

export default function HomePage() {
  const [selectedPerson, setSelectedPerson] = useState<TreePerson | null>(null);
  const [allPeople, setAllPeople] = useState<TreePerson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = () => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then((data: TreePerson[]) => {
        setAllPeople(data);
        setLoading(false);
        if (selectedPerson) {
          const updated = data.find((p) => p.id === selectedPerson.id);
          if (updated) setSelectedPerson(updated);
        }
      })
      .catch((err) => {
        console.error("Error fetching family tree:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <div className="loading-text">Loading family tree…</div>
      </div>
    );
  }

  return (
    <main>
      <FamilyTree people={allPeople} onSelectPerson={setSelectedPerson} />
      {selectedPerson && (
        <PersonDetail
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onNavigate={(p) => setSelectedPerson(p)}
          allPeople={allPeople}
          onPersonUpdate={fetchPeople}
        />
      )}
    </main>
  );
}
