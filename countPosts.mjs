import { prisma } from './server/src/index.js';

async function main() {
  const sujets = await prisma.sujet.findMany({
    include: { postes: true },
  });
  sujets.forEach(s => {
    const title = s.titre || s.categorie || 'Sans titre';
    console.log(`Sujet ${s.id} (${title}): ${s.postes.length} poste(s)`);
  });
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
