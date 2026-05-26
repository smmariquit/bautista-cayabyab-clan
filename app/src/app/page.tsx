"use client";

import { useState, useEffect } from "react";
import FamilyTree from "@/components/FamilyTree";
import PersonDetail from "@/components/PersonDetail";
import type { TreePerson } from "@/lib/types";

export default function HomePage() {
  const [selectedPerson, setSelectedPerson] = useState<TreePerson | null>(null);
  const [allPeople, setAllPeople] = useState<TreePerson[]>([]);

  useEffect(() => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then((data: TreePerson[]) => setAllPeople(data));
  }, []);

  return (
    <main>
      <FamilyTree onSelectPerson={setSelectedPerson} />
      {selectedPerson && (
        <PersonDetail
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onNavigate={(p) => setSelectedPerson(p)}
          allPeople={allPeople}
        />
      )}
    </main>
  );
}
