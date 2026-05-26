import { PrismaClient } from "@/generated/prisma";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  // If running in Vercel or standard serverless, fallback to standard Prisma native engine.
  // This avoids compile-time native dependencies (better-sqlite3) at runtime.
  const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
  
  if (isVercel) {
    prismaInstance = new PrismaClient();
  } else {
    try {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const dbPath = path.resolve(process.cwd(), "dev.db");
      const adapter = new PrismaBetterSqlite3({
        url: `file:${dbPath}`,
      });
      
      prismaInstance = new PrismaClient({ adapter } as any);
    } catch (e) {
      console.warn("Failed to initialize PrismaBetterSqlite3, falling back to standard Prisma client:", e);
      prismaInstance = new PrismaClient();
    }
  }
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
