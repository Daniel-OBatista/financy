import { PrismaClient, type Transaction } from "@prisma/client";

const prisma = new PrismaClient();

type TransactionType = Transaction["type"];

// Esse id precisa bater com o que você usa no Authorization: Bearer <userId>
const USER_ID = "dev-user";

async function main(): Promise<void> {
  // ✅ garante que existe um usuário (Category exige user)
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID, name: "Dev User" },
  });

  // ✅ evita duplicar seed (olha categorias desse user)
  const existing = await prisma.category.count({
    where: { user: { is: { id: USER_ID } } },
  });
  if (existing > 0) return;

  // ✅ categorias (CategoryCreateInput exige "user")
  const cat1 = await prisma.category.create({
    data: {
      title: "Carteira",
      description: "Dia a dia",
      icon: "wallet",
      color: "green",
      user: { connect: { id: USER_ID } },
    },
  });

  const cat2 = await prisma.category.create({
    data: {
      title: "Casa",
      description: "Contas",
      icon: "home",
      color: "blue",
      user: { connect: { id: USER_ID } },
    },
  });

  const cat3 = await prisma.category.create({
    data: {
      title: "Transporte",
      description: "Carro/Uber",
      icon: "car",
      color: "yellow",
      user: { connect: { id: USER_ID } },
    },
  });

  const tx = async (data: {
    description: string;
    date: string; // ✅ se seu model date é String, mantém string (YYYY-MM-DD)
    type: TransactionType;
    amountCents: number;
    categoryId?: string | null;
  }): Promise<void> => {
    await prisma.transaction.create({
      data: {
        description: data.description,
        date: data.date, // ✅ sem new Date()
        type: data.type,
        amountCents: data.amountCents,
        user: { connect: { id: USER_ID } },

        // ✅ relação: não usa categoryId direto (mais compatível)
        ...(typeof data.categoryId === "string"
          ? { category: { connect: { id: data.categoryId } } }
          : {}),
      },
    });
  };

  await tx({
    description: "Salário",
    date: "2026-02-01",
    type: "INCOME",
    amountCents: 650000,
    categoryId: null,
  });

  await tx({
    description: "Aluguel",
    date: "2026-02-05",
    type: "EXPENSE",
    amountCents: 180000,
    categoryId: cat2.id,
  });

  await tx({
    description: "Uber",
    date: "2026-02-08",
    type: "EXPENSE",
    amountCents: 4500,
    categoryId: cat3.id,
  });

  await tx({
    description: "Mercado",
    date: "2026-02-10",
    type: "EXPENSE",
    amountCents: 23500,
    categoryId: cat1.id,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });