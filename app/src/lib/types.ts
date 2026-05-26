export interface TreePerson {
  id: string;
  firstName: string;
  lastName: string;
  nicknames: string | null;
  gender: string | null;
  generation: number;
  lineageCode: string | null;
  occupation: string | null;
  bio: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  deathDate: string | null;
  partners: { id: string; type: string }[];
  children: string[];
  parents: string[];
}

export interface TreeNode {
  person: TreePerson;
  x: number;
  y: number;
  partner?: TreePerson;
}
