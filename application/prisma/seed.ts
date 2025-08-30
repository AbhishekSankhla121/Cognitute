import { PrismaClient } from '../src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workspace.create({
    data: { name: 'Acme Workspace' },
  });

  await prisma.user.createMany({
    data: [
      { email: 'abhisheksankhla121@gmail.com', name: 'Admin', role: 'Admin', workspaceId: ws.id },
      { email: 'abhisheksankhlasigh@gmail.com', name: 'Viewer', role: 'ReadOnly', workspaceId: ws.id },
    ],
  });

  await prisma.flag.create({
    data: {
      key: 'new-dashboard',
      defaultValue: false,
      isEnabled: true,
      workspaceId: ws.id,
      rules: {
        create: [
          {
            order: 1,
            attribute: 'country',
            comparator: 'IN',
            value: ['US', 'IN'],
            rolloutPercent: 50,
          },
          {
            order: 2,
            attribute: 'isBeta',
            comparator: 'EQ',
            value: true,
            rolloutPercent: 100,
          },
        ],
      },
    },
  });

}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
