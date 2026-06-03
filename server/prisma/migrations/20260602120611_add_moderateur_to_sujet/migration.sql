-- AlterTable
ALTER TABLE "sujets" ADD COLUMN     "moderateurId" INTEGER;

-- AddForeignKey
ALTER TABLE "sujets" ADD CONSTRAINT "sujets_moderateurId_fkey" FOREIGN KEY ("moderateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
