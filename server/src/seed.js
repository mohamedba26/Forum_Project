import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // ── Forum ──────────────────────────────────────────────────────────
  const forum = await prisma.forum.upsert({
    where:  { nom: 'Forum Principal' },
    update: {},
    create: { nom: 'Forum Principal' }
  })

  // ── Admin ──────────────────────────────────────────────────────────
  const admin = await prisma.utilisateur.upsert({
    where:  { email: 'admin@forum.com' },
    update: { role: 'admin' },
    create: {
      nom: 'Admin',
      email: 'admin@forum.com',
      motDePasse: await bcrypt.hash('admin123', 12),
      role: 'admin'
    }
  })

  // ── Modérateurs (1 per sujet) ──────────────────────────────────────
  const modoEducation = await prisma.utilisateur.upsert({
    where:  { email: 'modo1@forum.com' },
    update: { role: 'moderateur' },
    create: {
      nom: 'ModoEducation',
      email: 'modo1@forum.com',
      motDePasse: await bcrypt.hash('modo123', 12),
      role: 'moderateur'
    }
  })

  const modoTechnologie = await prisma.utilisateur.upsert({
    where:  { email: 'modo2@forum.com' },
    update: { role: 'moderateur' },
    create: {
      nom: 'ModoTechnologie',
      email: 'modo2@forum.com',
      motDePasse: await bcrypt.hash('modo123', 12),
      role: 'moderateur'
    }
  })

  const modoJuridique = await prisma.utilisateur.upsert({
    where:  { email: 'modo3@forum.com' },
    update: { role: 'moderateur' },
    create: {
      nom: 'ModoJuridique',
      email: 'modo3@forum.com',
      motDePasse: await bcrypt.hash('modo123', 12),
      role: 'moderateur'
    }
  })

  const modoSport = await prisma.utilisateur.upsert({
    where:  { email: 'modo4@forum.com' },
    update: { role: 'moderateur' },
    create: {
      nom: 'ModoSport',
      email: 'modo4@forum.com',
      motDePasse: await bcrypt.hash('modo123', 12),
      role: 'moderateur'
    }
  })

  // ── Regular Users ──────────────────────────────────────────────────
  const user1 = await prisma.utilisateur.upsert({
    where:  { email: 'user1@forum.com' },
    update: { role: 'utilisateur' },
    create: {
      nom: 'BraveAigle42',
      email: 'user1@forum.com',
      motDePasse: await bcrypt.hash('user123', 12),
      role: 'utilisateur'
    }
  })

  const user2 = await prisma.utilisateur.upsert({
    where:  { email: 'user2@forum.com' },
    update: { role: 'utilisateur' },
    create: {
      nom: 'SilentFox99',
      email: 'user2@forum.com',
      motDePasse: await bcrypt.hash('user123', 12),
      role: 'utilisateur'
    }
  })

  const user3 = await prisma.utilisateur.upsert({
    where:  { email: 'user3@forum.com' },
    update: { role: 'utilisateur' },
    create: {
      nom: 'CuriousOwl7',
      email: 'user3@forum.com',
      motDePasse: await bcrypt.hash('user123', 12),
      role: 'utilisateur'
    }
  })

  // Fix old user@forum.com if it exists — demote to utilisateur
  await prisma.utilisateur.updateMany({
    where: { email: 'user@forum.com' },
    data:  { role: 'utilisateur' }
  })

  // ── Sujets — with moderateurId properly set ────────────────────────
  const sujetEducation = await prisma.sujet.upsert({
    where:  { titre: 'Éducation' },
    update: { moderateurId: modoEducation.id, auteurId: admin.id },
    create: {
      titre:        'Éducation',
      description:  'Ressources, apprentissage, formation et pédagogie.',
      statut:       'valide',
      auteurId:     admin.id,
      forumId:      forum.id,
      moderateurId: modoEducation.id,
    }
  })

  const sujetTechnologie = await prisma.sujet.upsert({
    where:  { titre: 'Technologie' },
    update: { moderateurId: modoTechnologie.id, auteurId: admin.id },
    create: {
      titre:        'Technologie',
      description:  'Actualités tech, IA, développement et numérique.',
      statut:       'valide',
      auteurId:     admin.id,
      forumId:      forum.id,
      moderateurId: modoTechnologie.id,
    }
  })

  const sujetJuridique = await prisma.sujet.upsert({
    where:  { titre: 'Juridique' },
    update: { moderateurId: modoJuridique.id, auteurId: admin.id },
    create: {
      titre:        'Juridique',
      description:  'Droit numérique, vie privée, réglementation.',
      statut:       'valide',
      auteurId:     admin.id,
      forumId:      forum.id,
      moderateurId: modoJuridique.id,
    }
  })

  const sujetSport = await prisma.sujet.upsert({
    where:  { titre: 'Sport' },
    update: { moderateurId: modoSport.id, auteurId: admin.id },
    create: {
      titre:        'Sport',
      description:  'Actualités sportives, fitness, compétitions.',
      statut:       'valide',
      auteurId:     admin.id,
      forumId:      forum.id,
      moderateurId: modoSport.id,
    }
  })

  // ── Postes ─────────────────────────────────────────────────────────
  const poste1 = await prisma.poste.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      titre:    'Les meilleures ressources pour apprendre à coder',
      contenu:  'Partagez vos ressources préférées pour apprendre la programmation : sites, livres, tutoriels...',
      statut:   'valide',
      sujetId:  sujetEducation.id,
      auteurId: user1.id,
    }
  })

  const poste2 = await prisma.poste.upsert({
    where:  { id: 2 },
    update: {},
    create: {
      titre:    "L'IA va-t-elle remplacer les développeurs ?",
      contenu:  "Débat ouvert sur l'avenir du métier de développeur face à l'essor de l'intelligence artificielle.",
      statut:   'valide',
      sujetId:  sujetTechnologie.id,
      auteurId: user2.id,
    }
  })

  const poste3 = await prisma.poste.upsert({
    where:  { id: 3 },
    update: {},
    create: {
      titre:    'Droits numériques et vie privée en ligne',
      contenu:  'Vos droits face à la collecte de données par les plateformes. RGPD, cookies, surveillance...',
      statut:   'valide',
      sujetId:  sujetJuridique.id,
      auteurId: user3.id,
    }
  })

  // ── Commentaires ───────────────────────────────────────────────────
  await prisma.interaction.create({
    data: {
      type:     'commentaire',
      auteurId: user2.id,
      posteId:  poste1.id,
      commentaire: { create: { contenu: "J'recommande freeCodeCamp et The Odin Project, c'est gratuit et très complet !" } }
    }
  })

  await prisma.interaction.create({
    data: {
      type:     'commentaire',
      auteurId: user3.id,
      posteId:  poste2.id,
      commentaire: { create: { contenu: "L'IA va changer le métier, pas le remplacer. Les devs qui maîtrisent l'IA auront un avantage énorme." } }
    }
  })

  await prisma.interaction.create({
    data: {
      type:     'commentaire',
      auteurId: user1.id,
      posteId:  poste3.id,
      commentaire: { create: { contenu: "Le RGPD est un bon premier pas, mais son application reste très inégale selon les pays." } }
    }
  })

  console.log('\n✅ Seed terminé avec succès !\n')
  console.log('👤 Admin')
  console.log('   admin@forum.com         / admin123\n')
  console.log('🛡️  Modérateurs (1 par sujet)')
  console.log('   modo1@forum.com    / modo123  → Éducation')
  console.log('   modo2@forum.com  / modo123  → Technologie')
  console.log('   modo3@forum.com    / modo123  → Juridique')
  console.log('   modo4@forum.com        / modo123  → Sport\n')
  console.log('🙋 Utilisateurs')
  console.log('   user1@forum.com          / user123  (BraveAigle42)')
  console.log('   user2@forum.com          / user123  (SilentFox99)')
  console.log('   user3@forum.com          / user123  (CuriousOwl7)\n')
}

main().finally(() => prisma.$disconnect())