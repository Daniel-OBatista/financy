import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import type { Request, Response } from "express";

import { prisma, getUserIdFromRequest } from "./context.js";
import { typeDefs, resolvers } from "./schema.js";
import type { GraphQLContext } from "./context.js";

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

async function start(): Promise<void> {
  const app = express();

  app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
  app.use(express.json({ limit: "1mb" }));

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }: { req: Request; res: Response }) => {
        const userId = getUserIdFromRequest(req);
        return { prisma, userId };
      }
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 GraphQL em http://localhost:${PORT}/graphql`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});