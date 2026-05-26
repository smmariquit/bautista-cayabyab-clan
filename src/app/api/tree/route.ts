import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const people = await prisma.person.findMany({
    include: {
      parentOf: { select: { childId: true } },
      childOf: { select: { parentId: true } },
      partnerships1: { select: { partner2Id: true, type: true } },
      partnerships2: { select: { partner1Id: true, type: true } },
    },
    orderBy: [{ generation: "asc" }, { lineageCode: "asc" }],
  });

  // Build tree structure
  const nodes = people.map((p) => {
    const partners = [
      ...p.partnerships1.map((pp) => ({ id: pp.partner2Id, type: pp.type })),
      ...p.partnerships2.map((pp) => ({ id: pp.partner1Id, type: pp.type })),
    ];
    const children = p.parentOf.map((pc) => pc.childId);
    const parents = p.childOf.map((pc) => pc.parentId);

    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      nicknames: p.nicknames,
      gender: p.gender,
      generation: p.generation,
      lineageCode: p.lineageCode,
      occupation: p.occupation,
      bio: p.bio,
      photoUrl: p.photoUrl,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
      partners,
      children,
      parents,
    };
  });

  return NextResponse.json(nodes);
}
