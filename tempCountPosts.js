import { prisma } from './server/src/index.js';
(async () => {
  const sujets = await prisma.sujet.findMany({
    include: { postes: true },
    orderBy: { id: 'asc' },
  });
  const result = sujets.map(s => ({ id: s.id, titre: s.titre, nbPostes: s.postes.length }));
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
})();
