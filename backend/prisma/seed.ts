import { PrismaClient, type TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.category.count();
  if (existing > 0) return;

  const cat1 = await prisma.category.create({
    data: { title: "Carteira", description: "Dia a dia", icon: "wallet", color: "green" },
  });

  const cat2 = await prisma.category.create({
    data: { title: "Casa", description: "Contas", icon: "home", color: "blue" },
  });

  const cat3 = await prisma.category.create({
    data: { title: "Transporte", description: "Carro/Uber", icon: "car", color: "yellow" },
  });

  const tx = async (data: {
    description: string;
    date: string;
    type: TransactionType;
    amountCents: number;
    categoryId?: string | null;
  }) => {
    await prisma.transaction.create({
      data: {
        description: data.description,
        date: new Date(`${data.date}T00:00:00.000Z`),
        type: data.type,
        amountCents: data.amountCents,
        categoryId: data.categoryId ?? null,
      },
    });
  };

  await tx({ description: "Salário", date: "2026-02-01", type: "INCOME", amountCents: 650000, categoryId: null });
  await tx({ description: "Aluguel", date: "2026-02-05", type: "EXPENSE", amountCents: 180000, categoryId: cat2.id });
  await tx({ description: "Uber", date: "2026-02-08", type: "EXPENSE", amountCents: 4500, categoryId: cat3.id });
  await tx({ description: "Mercado", date: "2026-02-10", type: "EXPENSE", amountCents: 23500, categoryId: cat1.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });