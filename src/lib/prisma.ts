// src/lib/prisma.ts

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type CloudflareContext = {
  env: {
    DB: unknown;
  };
};

export function createPrismaClient() {
  const { env } = getCloudflareContext() as unknown as CloudflareContext;
  const adapter = new PrismaD1(env.DB as never);
  return new PrismaClient({ adapter });
}

export async function withPrisma<T>(handler: (prisma: PrismaClient) => Promise<T>) {
  const prisma = createPrismaClient();

  try {
    return await handler(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
