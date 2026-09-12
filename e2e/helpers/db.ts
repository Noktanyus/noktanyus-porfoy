import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function db(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ["error"],
    });
  }
  return prisma;
}

export async function closeDb() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export type { PrismaClient } from "@prisma/client";
