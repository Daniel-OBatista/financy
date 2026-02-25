import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context.js";
import { TransactionType as PrismaTxEnum } from "@prisma/client";
import type { Prisma, TransactionType as PrismaTransactionType } from "@prisma/client";

type TransactionTypeGQL = "INCOME" | "EXPENSE";

type CategoryInput = {
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
};

type TransactionInput = {
  description: string;
  date: string; // YYYY-MM-DD
  type: TransactionTypeGQL;
  amount?: number | null; // opcional (reais)
  amountCents?: number | null; // preferido pelo frontend
  categoryId?: string | null;
};

function requireUserId(ctx: GraphQLContext): string {
  if (ctx.userId == null) {
    throw new GraphQLError("Não autenticado. Envie Authorization: Bearer <userId>", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.userId;
}

async function ensureUser(ctx: GraphQLContext, userId: string): Promise<void> {
  await ctx.prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: "Conta" },
  });
}

function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return NaN;
  return Math.round(amount * 100);
}

function iso(d: Date): string {
  return d.toISOString();
}

/**
 * ✅ Detecta se o Prisma enum tem INCOME/EXPENSE ou ENTRADA/SAIDA.
 * Isso evita erro de type em "type: args.input.type".
 */
function prismaUsesIncomeExpense(): boolean {
  return Object.prototype.hasOwnProperty.call(PrismaTxEnum, "INCOME");
}

function gqlToPrismaTxType(v: TransactionTypeGQL): PrismaTransactionType {
  if (prismaUsesIncomeExpense()) {
    return v as unknown as PrismaTransactionType;
  }
  // Prisma antigo: ENTRADA/SAIDA
  const mapped = v === "INCOME" ? "ENTRADA" : "SAIDA";
  return mapped as unknown as PrismaTransactionType;
}

function prismaToGqlTxType(v: PrismaTransactionType): TransactionTypeGQL {
  const raw = v as unknown as string;
  if (raw === "INCOME" || raw === "ENTRADA") return "INCOME";
  if (raw === "EXPENSE" || raw === "SAIDA") return "EXPENSE";

  throw new GraphQLError("Tipo inválido no banco (esperado INCOME/EXPENSE ou ENTRADA/SAIDA)", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

export const typeDefs = /* GraphQL */ `
  enum TransactionType {
    INCOME
    EXPENSE
  }

  type User {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
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
    type: TransactionType!
    date: String!
    amountCents: Int!
    amount: Float!
    categoryId: ID
    category: Category
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CategoryInput {
    title: String!
    description: String
    icon: String
    color: String
  }

  input TransactionInput {
    description: String!
    date: String!
    type: TransactionType!
    amount: Float
    amountCents: Int
    categoryId: ID
  }

  type Query {
    me: User!
    categories: [Category!]!
    transactions: [Transaction!]!
  }

  type Mutation {
    signIn(name: String!): AuthPayload!
    updateProfile(name: String!): User!

    createCategory(input: CategoryInput!): Category!
    updateCategory(id: ID!, input: CategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    createTransaction(input: TransactionInput!): Transaction!
    updateTransaction(id: ID!, input: TransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
  }
`;

type GqlUser = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type GqlCategory = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type GqlTransaction = {
  id: string;
  description: string;
  date: string;
  type: TransactionTypeGQL;
  amountCents: number;
  categoryId: string | null;
  category: GqlCategory | null;
  createdAt: string;
  updatedAt: string;
};

// ✅ força tipagem com category incluída
type TxWithCategory = Prisma.TransactionGetPayload<{ include: { category: true } }>;

export const resolvers = {
  Transaction: {
    amount(parent: { amountCents: number }): number {
      return parent.amountCents / 100;
    },
  },

  Query: {
    async me(_: unknown, __: unknown, ctx: GraphQLContext): Promise<GqlUser> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new GraphQLError("Usuário não encontrado", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return {
        id: user.id,
        name: user.name,
        createdAt: iso(user.createdAt),
        updatedAt: iso(user.updatedAt),
      };
    },

    async categories(_: unknown, __: unknown, ctx: GraphQLContext): Promise<GqlCategory[]> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const rows = await ctx.prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return rows.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? null,
        icon: c.icon,
        color: c.color,
        createdAt: iso(c.createdAt),
        updatedAt: iso(c.updatedAt),
      }));
    },

    async transactions(_: unknown, __: unknown, ctx: GraphQLContext): Promise<GqlTransaction[]> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const rows: TxWithCategory[] = await ctx.prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });

      return rows.map((t) => {
        const safeType = prismaToGqlTxType(t.type);

        return {
          id: t.id,
          description: t.description,
          date: t.date,
          type: safeType,
          amountCents: t.amountCents,
          categoryId: t.categoryId ?? null,
          category: t.category
            ? {
                id: t.category.id,
                title: t.category.title,
                description: t.category.description ?? null,
                icon: t.category.icon,
                color: t.category.color,
                createdAt: iso(t.category.createdAt),
                updatedAt: iso(t.category.updatedAt),
              }
            : null,
          createdAt: iso(t.createdAt),
          updatedAt: iso(t.updatedAt),
        };
      });
    },
  },

  Mutation: {
    async signIn(
      _: unknown,
      args: { name: string },
      ctx: GraphQLContext
    ): Promise<{ token: string; user: GqlUser }> {
      const name = args.name.trim();
      if (name.length < 2) {
        throw new GraphQLError("Nome inválido", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.prisma.user.create({ data: { name } });

      return {
        token: user.id,
        user: {
          id: user.id,
          name: user.name,
          createdAt: iso(user.createdAt),
          updatedAt: iso(user.updatedAt),
        },
      };
    },

    async updateProfile(_: unknown, args: { name: string }, ctx: GraphQLContext): Promise<GqlUser> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const name = args.name.trim();
      if (name.length < 2) {
        throw new GraphQLError("Nome inválido", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const user = await ctx.prisma.user.update({
        where: { id: userId },
        data: { name },
      });

      return {
        id: user.id,
        name: user.name,
        createdAt: iso(user.createdAt),
        updatedAt: iso(user.updatedAt),
      };
    },

    async createCategory(_: unknown, args: { input: CategoryInput }, ctx: GraphQLContext): Promise<GqlCategory> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const title = args.input.title.trim();
      if (title.length < 2) {
        throw new GraphQLError("Título inválido", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const created = await ctx.prisma.category.create({
        data: {
          userId,
          title,
          description: args.input.description ?? null,
          icon: args.input.icon ?? "wallet",
          color: args.input.color ?? "green",
        },
      });

      return {
        id: created.id,
        title: created.title,
        description: created.description ?? null,
        icon: created.icon,
        color: created.color,
        createdAt: iso(created.createdAt),
        updatedAt: iso(created.updatedAt),
      };
    },

    async updateCategory(
      _: unknown,
      args: { id: string; input: CategoryInput },
      ctx: GraphQLContext
    ): Promise<GqlCategory> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const title = args.input.title.trim();
      if (title.length < 2) {
        throw new GraphQLError("Título inválido", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existing = await ctx.prisma.category.findFirst({
        where: { id: args.id, userId },
      });
      if (!existing) {
        throw new GraphQLError("Categoria não encontrada", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const updated = await ctx.prisma.category.update({
        where: { id: args.id },
        data: {
          title,
          description: args.input.description ?? null,
          icon: args.input.icon ?? existing.icon,
          color: args.input.color ?? existing.color,
        },
      });

      return {
        id: updated.id,
        title: updated.title,
        description: updated.description ?? null,
        icon: updated.icon,
        color: updated.color,
        createdAt: iso(updated.createdAt),
        updatedAt: iso(updated.updatedAt),
      };
    },

    async deleteCategory(_: unknown, args: { id: string }, ctx: GraphQLContext): Promise<boolean> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const existing = await ctx.prisma.category.findFirst({
        where: { id: args.id, userId },
      });
      if (!existing) {
        throw new GraphQLError("Categoria não encontrada", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      await ctx.prisma.category.delete({ where: { id: args.id } });
      return true;
    },

    async createTransaction(
      _: unknown,
      args: { input: TransactionInput },
      ctx: GraphQLContext
    ): Promise<GqlTransaction> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const description = args.input.description.trim();
      if (description.length < 2) {
        throw new GraphQLError("Descrição inválida", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const cents =
        typeof args.input.amountCents === "number"
          ? Math.round(args.input.amountCents)
          : typeof args.input.amount === "number"
            ? toCents(args.input.amount)
            : NaN;

      if (!Number.isInteger(cents) || cents <= 0) {
        throw new GraphQLError("Valor inválido", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const created: TxWithCategory = await ctx.prisma.transaction.create({
        data: {
          userId,
          description,
          date: args.input.date,
          type: gqlToPrismaTxType(args.input.type),
          amountCents: cents,
          categoryId: args.input.categoryId ?? null,
        },
        include: { category: true },
      });

      const safeType = prismaToGqlTxType(created.type);

      return {
        id: created.id,
        description: created.description,
        date: created.date,
        type: safeType,
        amountCents: created.amountCents,
        categoryId: created.categoryId ?? null,
        category: created.category
          ? {
              id: created.category.id,
              title: created.category.title,
              description: created.category.description ?? null,
              icon: created.category.icon,
              color: created.category.color,
              createdAt: iso(created.category.createdAt),
              updatedAt: iso(created.category.updatedAt),
            }
          : null,
        createdAt: iso(created.createdAt),
        updatedAt: iso(created.updatedAt),
      };
    },

    async updateTransaction(
      _: unknown,
      args: { id: string; input: TransactionInput },
      ctx: GraphQLContext
    ): Promise<GqlTransaction> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const existing = await ctx.prisma.transaction.findFirst({
        where: { id: args.id, userId },
      });
      if (!existing) {
        throw new GraphQLError("Transação não encontrada", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const description = args.input.description.trim();
      if (description.length < 2) {
        throw new GraphQLError("Descrição inválida", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const cents =
        typeof args.input.amountCents === "number"
          ? Math.round(args.input.amountCents)
          : typeof args.input.amount === "number"
            ? toCents(args.input.amount)
            : NaN;

      if (!Number.isInteger(cents) || cents <= 0) {
        throw new GraphQLError("Valor inválido", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const updated: TxWithCategory = await ctx.prisma.transaction.update({
        where: { id: args.id },
        data: {
          description,
          date: args.input.date,
          type: gqlToPrismaTxType(args.input.type),
          amountCents: cents,
          categoryId: args.input.categoryId ?? null,
        },
        include: { category: true },
      });

      const safeType = prismaToGqlTxType(updated.type);

      return {
        id: updated.id,
        description: updated.description,
        date: updated.date,
        type: safeType,
        amountCents: updated.amountCents,
        categoryId: updated.categoryId ?? null,
        category: updated.category
          ? {
              id: updated.category.id,
              title: updated.category.title,
              description: updated.category.description ?? null,
              icon: updated.category.icon,
              color: updated.category.color,
              createdAt: iso(updated.category.createdAt),
              updatedAt: iso(updated.category.updatedAt),
            }
          : null,
        createdAt: iso(updated.createdAt),
        updatedAt: iso(updated.updatedAt),
      };
    },

    async deleteTransaction(_: unknown, args: { id: string }, ctx: GraphQLContext): Promise<boolean> {
      const userId = requireUserId(ctx);
      await ensureUser(ctx, userId);

      const existing = await ctx.prisma.transaction.findFirst({
        where: { id: args.id, userId },
      });
      if (!existing) {
        throw new GraphQLError("Transação não encontrada", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      await ctx.prisma.transaction.delete({ where: { id: args.id } });
      return true;
    },
  },
};