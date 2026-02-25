import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { PrismaClient, type TransactionType as PrismaTransactionType } from "@prisma/client";

type GqlContext = { prisma: PrismaClient };

const prisma = new PrismaClient();

const typeDefs = /* GraphQL */ `
  enum TransactionType {
    INCOME
    EXPENSE
  }

  type Category {
    id: ID!
    title: String!
    description: String
    icon: String!
    color: String!
    createdAt: String!
    updatedAt: String!
  }

  type Transaction {
    id: ID!
    description: String!
    date: String!
    type: TransactionType!
    amountCents: Int!
    categoryId: ID
    category: Category
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    categories: [Category!]!
    category(id: ID!): Category
    transactions: [Transaction!]!
    transaction(id: ID!): Transaction
  }

  input CreateCategoryInput {
    title: String!
    description: String
    icon: String!
    color: String!
  }

  input UpdateCategoryInput {
    id: ID!
    title: String
    description: String
    icon: String
    color: String
  }

  input CreateTransactionInput {
    description: String!
    date: String!
    type: TransactionType!
    amountCents: Int!
    categoryId: ID
  }

  input UpdateTransactionInput {
    id: ID!
    description: String
    date: String
    type: TransactionType
    amountCents: Int
    categoryId: ID
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransaction(input: UpdateTransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
  }
`;

function toIso(d: Date): string {
  return d.toISOString();
}

function parseDateInput(v: string): Date {
  // aceita "YYYY-MM-DD" e ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00.000Z`);
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) throw new Error("date inválida");
  return dt;
}

const resolvers = {
  Query: {
    categories: async (_: unknown, __: unknown, ctx: GqlContext) => {
      return ctx.prisma.category.findMany({ orderBy: { createdAt: "asc" } });
    },
    category: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      return ctx.prisma.category.findUnique({ where: { id: args.id } });
    },
    transactions: async (_: unknown, __: unknown, ctx: GqlContext) => {
      return ctx.prisma.transaction.findMany({
        orderBy: { date: "desc" },
        include: { category: true },
      });
    },
    transaction: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      return ctx.prisma.transaction.findUnique({
        where: { id: args.id },
        include: { category: true },
      });
    },
  },

  Mutation: {
    createCategory: async (
      _: unknown,
      args: { input: { title: string; description?: string | null; icon: string; color: string } },
      ctx: GqlContext
    ) => {
      const { title, description, icon, color } = args.input;
      return ctx.prisma.category.create({
        data: { title, description: description ?? null, icon, color },
      });
    },

    updateCategory: async (
      _: unknown,
      args: { input: { id: string; title?: string; description?: string | null; icon?: string; color?: string } },
      ctx: GqlContext
    ) => {
      const { id, ...patch } = args.input;
      return ctx.prisma.category.update({
        where: { id },
        data: {
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
          ...(patch.color !== undefined ? { color: patch.color } : {}),
        },
      });
    },

    deleteCategory: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      await ctx.prisma.category.delete({ where: { id: args.id } });
      return true;
    },

    createTransaction: async (
      _: unknown,
      args: { input: { description: string; date: string; type: PrismaTransactionType; amountCents: number; categoryId?: string | null } },
      ctx: GqlContext
    ) => {
      const { description, date, type, amountCents, categoryId } = args.input;
      if (amountCents < 0) throw new Error("amountCents deve ser >= 0");

      return ctx.prisma.transaction.create({
        data: {
          description,
          date: parseDateInput(date),
          type,
          amountCents,
          categoryId: categoryId ?? null,
        },
        include: { category: true },
      });
    },

    updateTransaction: async (
      _: unknown,
      args: { input: { id: string; description?: string; date?: string; type?: PrismaTransactionType; amountCents?: number; categoryId?: string | null } },
      ctx: GqlContext
    ) => {
      const { id, ...patch } = args.input;

      if (patch.amountCents !== undefined && patch.amountCents < 0) {
        throw new Error("amountCents deve ser >= 0");
      }

      return ctx.prisma.transaction.update({
        where: { id },
        data: {
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.date !== undefined ? { date: parseDateInput(patch.date) } : {}),
          ...(patch.type !== undefined ? { type: patch.type } : {}),
          ...(patch.amountCents !== undefined ? { amountCents: patch.amountCents } : {}),
          ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
        },
        include: { category: true },
      });
    },

    deleteTransaction: async (_: unknown, args: { id: string }, ctx: GqlContext) => {
      await ctx.prisma.transaction.delete({ where: { id: args.id } });
      return true;
    },
  },

  Category: {
    createdAt: (p: { createdAt: Date }) => toIso(p.createdAt),
    updatedAt: (p: { updatedAt: Date }) => toIso(p.updatedAt),
  },

  Transaction: {
    date: (p: { date: Date }) => toIso(p.date),
    createdAt: (p: { createdAt: Date }) => toIso(p.createdAt),
    updatedAt: (p: { updatedAt: Date }) => toIso(p.updatedAt),
  },
};

async function main(): Promise<void> {
  const server = new ApolloServer<GqlContext>({ typeDefs, resolvers });
  await server.start();

  const app = express();

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: ["http://localhost:5173"],
      credentials: false,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async (): Promise<GqlContext> => ({ prisma }),
    })
  );

  const port = Number(process.env.PORT ?? 4000);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 GraphQL em http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});