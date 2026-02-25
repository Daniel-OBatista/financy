import type { Category, Prisma, Transaction } from "@prisma/client";
import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context.js";

type TransactionType = Transaction["type"];

type TransactionsFilterInput = {
  type?: TransactionType | null;
  from?: string | null; // ISO (string)
  to?: string | null; // ISO (string)
  categoryId?: string | null; // id da categoria (relation)
};

type CreateCategoryInput = {
  title: string;
  description?: string | null;
  icon: string;
  color: string;
};

type UpdateCategoryInput = Partial<CreateCategoryInput>;

type CreateTransactionInput = {
  description: string;
  date: string; // ISO (string)
  type: TransactionType;
  amountCents: number;
  categoryId?: string | null;
};

type UpdateTransactionInput = Partial<CreateTransactionInput>;

type CategoryDTO = Omit<Category, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type TransactionDTO = Omit<Transaction, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  category: CategoryDTO | null;
};

function requireUserId(ctx: GraphQLContext): string {
  if (!ctx.userId) {
    throw new GraphQLError("Não autenticado. Envie Authorization: Bearer <userId>", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.userId;
}

function serializeCategory(c: Category): CategoryDTO {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function serializeTransaction(
  t: Transaction & { category: Category | null },
): TransactionDTO {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    category: t.category ? serializeCategory(t.category) : null,
  };
}

export const resolvers = {
  Query: {
    categories: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ): Promise<CategoryDTO[]> => {
      const userId = requireUserId(ctx);

      const rows = await ctx.prisma.category.findMany({
        where: { user: { is: { id: userId } } }, // ✅ filtra por usuário
        orderBy: { createdAt: "desc" },
      });

      return rows.map(serializeCategory);
    },

    transactions: async (
      _parent: unknown,
      args: { filter?: TransactionsFilterInput | null },
      ctx: GraphQLContext,
    ): Promise<TransactionDTO[]> => {
      const userId = requireUserId(ctx);
      const f = args.filter ?? null;

      const where: Prisma.TransactionWhereInput = {
        user: { is: { id: userId } }, // ✅ filtra por usuário
      };

      if (f?.type != null) {
        where.type = f.type as Prisma.TransactionWhereInput["type"];
      }

      // ✅ como você recebe categoryId no GraphQL, filtra pela relation category
      if (typeof f?.categoryId === "string") {
        where.category = { is: { id: f.categoryId } };
      }

      // ✅ seu date é string (pelo erro anterior), então usa StringFilter (gte/lte em string)
      if (typeof f?.from === "string" || typeof f?.to === "string") {
        const dateFilter: Prisma.StringFilter = {};
        if (typeof f.from === "string") dateFilter.gte = f.from;
        if (typeof f.to === "string") dateFilter.lte = f.to;
        where.date = dateFilter;
      }

      const rows = await ctx.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
      });

      return rows.map(serializeTransaction);
    },
  },

  Mutation: {
    createCategory: async (
      _parent: unknown,
      args: { input: CreateCategoryInput },
      ctx: GraphQLContext,
    ): Promise<CategoryDTO> => {
      const userId = requireUserId(ctx);

      const c = await ctx.prisma.category.create({
        data: {
          ...args.input,
          // ✅ CategoryCreateInput exige "user"
          user: { connect: { id: userId } },
        },
      });

      return serializeCategory(c);
    },

    updateCategory: async (
      _parent: unknown,
      args: { id: string; input: UpdateCategoryInput },
      ctx: GraphQLContext,
    ): Promise<CategoryDTO> => {
      const userId = requireUserId(ctx);

      // ✅ garante que só edita categoria do próprio user
      const exists = await ctx.prisma.category.findFirst({
        where: { id: args.id, user: { is: { id: userId } } },
        select: { id: true },
      });
      if (!exists) throw new GraphQLError("Categoria não encontrada.", { extensions: { code: "NOT_FOUND" } });

      const c = await ctx.prisma.category.update({
        where: { id: args.id },
        data: args.input,
      });

      return serializeCategory(c);
    },

    deleteCategory: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ): Promise<boolean> => {
      const userId = requireUserId(ctx);

      const exists = await ctx.prisma.category.findFirst({
        where: { id: args.id, user: { is: { id: userId } } },
        select: { id: true },
      });
      if (!exists) throw new GraphQLError("Categoria não encontrada.", { extensions: { code: "NOT_FOUND" } });

      await ctx.prisma.category.delete({ where: { id: args.id } });
      return true;
    },

    createTransaction: async (
      _parent: unknown,
      args: { input: CreateTransactionInput },
      ctx: GraphQLContext,
    ): Promise<TransactionDTO> => {
      const userId = requireUserId(ctx);

      const t = await ctx.prisma.transaction.create({
        data: {
          description: args.input.description,
          date: args.input.date, // ✅ string
          type: args.input.type,
          amountCents: args.input.amountCents,

          // ✅ Transaction também deve ser do user
          user: { connect: { id: userId } },

          // ✅ relation category (se vier)
          ...(typeof args.input.categoryId === "string"
            ? { category: { connect: { id: args.input.categoryId } } }
            : {}),
        },
        include: { category: true },
      });

      return serializeTransaction(t);
    },

    updateTransaction: async (
      _parent: unknown,
      args: { id: string; input: UpdateTransactionInput },
      ctx: GraphQLContext,
    ): Promise<TransactionDTO> => {
      const userId = requireUserId(ctx);

      // ✅ garante que só edita transação do próprio user
      const exists = await ctx.prisma.transaction.findFirst({
        where: { id: args.id, user: { is: { id: userId } } },
        select: { id: true },
      });
      if (!exists) throw new GraphQLError("Transação não encontrada.", { extensions: { code: "NOT_FOUND" } });

      const data: Prisma.TransactionUpdateInput = {};

      if (typeof args.input.description === "string") data.description = args.input.description;
      if (typeof args.input.date === "string") data.date = args.input.date; // ✅ string
      if (args.input.type != null) data.type = args.input.type as Prisma.TransactionUpdateInput["type"];
      if (typeof args.input.amountCents === "number") data.amountCents = args.input.amountCents;

      // ✅ NÃO existe categoryId no UpdateInput => atualiza via relation "category"
      if ("categoryId" in args.input) {
        if (typeof args.input.categoryId === "string") {
          data.category = { connect: { id: args.input.categoryId } };
        } else {
          // se sua relação category for opcional:
          data.category = { disconnect: true };
        }
      }

      const t = await ctx.prisma.transaction.update({
        where: { id: args.id },
        data,
        include: { category: true },
      });

      return serializeTransaction(t);
    },

    deleteTransaction: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ): Promise<boolean> => {
      const userId = requireUserId(ctx);

      const exists = await ctx.prisma.transaction.findFirst({
        where: { id: args.id, user: { is: { id: userId } } },
        select: { id: true },
      });
      if (!exists) throw new GraphQLError("Transação não encontrada.", { extensions: { code: "NOT_FOUND" } });

      await ctx.prisma.transaction.delete({ where: { id: args.id } });
      return true;
    },
  },
};