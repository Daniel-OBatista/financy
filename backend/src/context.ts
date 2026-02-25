import { PrismaClient } from "@prisma/client";
import type { Request } from "express";

export type GraphQLContext = {
  prisma: PrismaClient;
  userId: string | null;
};

export function getUserIdFromRequest(req: Request): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice("bearer ".length).trim();
    return token.length > 0 ? token : null;
  }

  const headerUserId = req.headers["x-user-id"];
  if (typeof headerUserId === "string" && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }

  return null;
}

export const prisma = new PrismaClient();