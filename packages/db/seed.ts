import prisma from './src/index.ts';

async function main() {
  await prisma.region.upsert({
    where: { id: 'us-east-1' },
    update: {},
    create: {
      id: 'us-east-1',
      name: 'US East (N. Virginia)',
    },
  });
  console.log('Region seeded!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
