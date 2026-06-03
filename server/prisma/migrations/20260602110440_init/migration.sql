-- CreateEnum
CREATE TYPE "Role" AS ENUM ('utilisateur', 'moderateur', 'admin');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('en_attente', 'valide', 'supprime');

-- CreateEnum
CREATE TYPE "TypeMedia" AS ENUM ('texte', 'image', 'vocal', 'video');

-- CreateEnum
CREATE TYPE "TypeInteraction" AS ENUM ('commentaire', 'chat', 'report', 'reaction');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "estBloque" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'utilisateur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forums" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "forums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sujets" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'valide',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forumId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "sujets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postes" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL DEFAULT '',
    "typeMedia" "TypeMedia" NOT NULL DEFAULT 'texte',
    "mediaUrl" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'valide',
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sujetId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "postes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TypeInteraction" NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "posteId" INTEGER,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaires" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "typeMedia" "TypeMedia" NOT NULL DEFAULT 'texte',
    "mediaUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interactionId" INTEGER NOT NULL,

    CONSTRAINT "commentaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" SERIAL NOT NULL,
    "typeReaction" TEXT NOT NULL,
    "interactionId" INTEGER NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expediteurId" INTEGER NOT NULL,
    "destinataireId" INTEGER NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "raison" TEXT NOT NULL,
    "detail" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'en_attente',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reporteurId" INTEGER NOT NULL,
    "utilisateurSignaleId" INTEGER,
    "commentaireId" INTEGER,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sujet_likes" (
    "id" SERIAL NOT NULL,
    "sujetId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "sujet_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poste_likes" (
    "id" SERIAL NOT NULL,
    "posteId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "poste_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaire_likes" (
    "id" SERIAL NOT NULL,
    "commentaireId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "commentaire_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "forums_nom_key" ON "forums"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "sujets_titre_key" ON "sujets"("titre");

-- CreateIndex
CREATE UNIQUE INDEX "commentaires_interactionId_key" ON "commentaires"("interactionId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_interactionId_key" ON "reactions"("interactionId");

-- CreateIndex
CREATE UNIQUE INDEX "sujet_likes_sujetId_auteurId_key" ON "sujet_likes"("sujetId", "auteurId");

-- CreateIndex
CREATE UNIQUE INDEX "poste_likes_posteId_auteurId_key" ON "poste_likes"("posteId", "auteurId");

-- CreateIndex
CREATE UNIQUE INDEX "commentaire_likes_commentaireId_auteurId_key" ON "commentaire_likes"("commentaireId", "auteurId");

-- AddForeignKey
ALTER TABLE "sujets" ADD CONSTRAINT "sujets_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "forums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sujets" ADD CONSTRAINT "sujets_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes" ADD CONSTRAINT "postes_sujetId_fkey" FOREIGN KEY ("sujetId") REFERENCES "sujets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes" ADD CONSTRAINT "postes_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporteurId_fkey" FOREIGN KEY ("reporteurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_utilisateurSignaleId_fkey" FOREIGN KEY ("utilisateurSignaleId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sujet_likes" ADD CONSTRAINT "sujet_likes_sujetId_fkey" FOREIGN KEY ("sujetId") REFERENCES "sujets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sujet_likes" ADD CONSTRAINT "sujet_likes_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poste_likes" ADD CONSTRAINT "poste_likes_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poste_likes" ADD CONSTRAINT "poste_likes_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaire_likes" ADD CONSTRAINT "commentaire_likes_commentaireId_fkey" FOREIGN KEY ("commentaireId") REFERENCES "commentaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaire_likes" ADD CONSTRAINT "commentaire_likes_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
