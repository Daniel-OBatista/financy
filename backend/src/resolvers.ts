import type { TransactionType } from "@prisma/client";
import { prisma } from "./prisma";

type TransactionsFilterInput = {
  type?: TransactionType | null;
  from?: string | null;      // ISO
  to?: string | null;        // ISO
  categoryId?: string | null;
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
  date: string; // ISO
  type: TransactionType;
  amountCents: number;
  categoryId?: string | null;
};

type UpdateTransactionInput = Partial<CreateTransactionInput>;

export const resolvers = {
  Query: {
    categories: async () => {
      const rows = await prisma.category.findMany({ orderBy: { createdAt: "desc" } });
      return rows.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    },

    transactions: async (_: unknown, args: { filter?: TransactionsFilterInput | null }) => {
      const f = args.filter ?? null;

      const where: {
        type?: TransactionType;
        categoryId?: string | null;
        date?: { gte?: Date; lte?: Date };
      } = {};

      if (f?.type) where.type = f.type;
      if (typeof f?.categoryId === "string") where.categoryId = f.categoryId;

      if (f?.from || f?.to) {
        where.date = {};
        if (f.from) where.date.gte = new Date(f.from);
        if (f.to) where.date.lte = new Date(f.to);
      }

      const rows = await prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
      });

      return rows.map((t) => ({
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        category: t.category
          ? {
              ...t.category,
              createdAt: t.category.createdAt.toISOString(),
              updatedAt: t.category.updatedAt.toISOString(),
            }
          : null,
      }));
    },
  },

  Mutation: {
    createCategory: async (_: unknown, args: { input: CreateCategoryInput }) => {
      const c = await prisma.category.create({ data: args.input });
      return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
    },

    updateCategory: async (_: unknown, args: { id: string; input: UpdateCategoryInput }) => {
      const c = await prisma.category.update({ where: { id: args.id }, data: args.input });
      return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
    },

    deleteCategory: async (_: unknown, args: { id: string }) => {
      await prisma.category.delete({ where: { id: args.id } });
      return true;
    },

    createTransaction: async (_: unknown, args: { input: CreateTransactionInput }) => {
      const t = await prisma.transaction.create({
        data: {
          description: args.input.description,
          date: new Date(args.input.date),
          type: args.input.type,
          amountCents: args.input.amountCents,
          categoryId: args.input.categoryId ?? null,
        },
        include: { category: true },
      });

      return {
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        category: t.category
          ? { ...t.category, createdAt: t.category.createdAt.toISOString(), updatedAt: t.category.updatedAt.toISOString() }
          : null,
      };
    },

    updateTransaction: async (_: unknown, args: { id: string; input: UpdateTransactionInput }) => {
      const data: Record<string, unknown> = { ...args.input };

      if (typeof args.input.date === "string") data.date = new Date(args.input.date);
      if (!("categoryId" in args.input)) delete data.categoryId;

      const t = await prisma.transaction.update({
        where: { id: args.id },
        data,
        include: { category: true },
      });

      return {
        ...t,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        category: t.category
          ? { ...t.category, createdAt: t.category.createdAt.toISOString(), updatedAt: t.category.updatedAt.toISOString() }
          : null,
      };
    },

    deleteTransaction: async (_: unknown, args: { id: string }) => {
      await prisma.transaction.delete({ where: { id: args.id } });
      return true;
    },
  },
};