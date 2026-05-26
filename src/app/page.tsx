"use client";

import { useState, useEffect } from "react";
import FamilyTree from "@/components/FamilyTree";
import PersonDetail from "@/components/PersonDetail";
import type { TreePerson } from "@/lib/types";

export default function HomePage() {
  const [selectedPerson, setSelectedPerson] = useState<TreePerson | null>(null);
  const [allPeople, setAllPeople] = useState<TreePerson[]>([]);

  const fetchPeople = () => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then((data: TreePerson[]) => {
        setAllPeople(data);
        if (selectedPerson) {
          const updated = data.find((p) => p.id === selectedPerson.id);
          if (updated) setSelectedPerson(updated);
        }
      });
  };

  useEffect(() => {
    fetchPeople();
  }, []);

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
