import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      parentOf: {
        include: { child: true },
      },
      childOf: {
        include: { parent: true },
      },
      partnerships1: {
        include: { partner2: true },
      },
      partnerships2: {
        include: { partner1: true },
      },
    },
  });

  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(person);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const person = await prisma.person.update({ where: { id }, data: body });
  return NextResponse.json(person);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
