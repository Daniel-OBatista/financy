import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { PrismaClient, type TransactionType as PrismaTxType } from "@prisma/client";

type GqlContext = {
  prisma: PrismaClient;
};

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
    transactions: [Transaction!]!
  }

  input CreateCategoryInput {
    title: String!
    description: String
    icon: String!
    color: String!
  }

  input CreateTransactionInput {
    description: String!
    date: String! # aceita "YYYY-MM-DD" ou ISO
    type: TransactionType!
    amountCents: Int!
    categoryId: ID
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    createTransaction(input: CreateTransactionInput!): Transaction!
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
    transactions: async (_: unknown, __: unknown, ctx: GqlContext) => {
      return ctx.prisma.transaction.findMany({
        orderBy: { date: "desc" },
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

    createTransaction: async (
      _: unknown,
      args: {
        input: {
          description: string;
          date: string;
          type: PrismaTxType;
          amountCents: number;
          categoryId?: string | null;
        };
      },
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
  },

  Transaction: {
    date: (parent: { date: Date }) => toIso(parent.date),
    createdAt: (parent: { createdAt: Date }) => toIso(parent.createdAt),
    updatedAt: (parent: { updatedAt: Date }) => toIso(parent.updatedAt),
  },

  Category: {
    createdAt: (parent: { createdAt: Date }) => toIso(parent.createdAt),
    updatedAt: (parent: { updatedAt: Date }) => toIso(parent.updatedAt),
  },
};

async function main(): Promise<void> {
  const server = new ApolloServer<GqlContext>({
    typeDefs,
    resolvers,
  });

  const port = Number(process.env.PORT ?? 4000);

  const { url } = await startStandaloneServer(server, {
    listen: { port },
    context: async (): Promise<GqlContext> => ({ prisma }),
  });

  // eslint-disable-next-line no-console
  console.log(`🚀 GraphQL pronto em ${url}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});