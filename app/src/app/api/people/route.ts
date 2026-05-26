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

  return NextResponse.json(people);
}

export async function POST(req: Request) {
  const body = await req.json();
  const person = await prisma.person.create({ data: body });
  return NextResponse.json(person, { status: 201 });
}
