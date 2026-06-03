-- AlterTable
ALTER TABLE "commentaires" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "commentaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;
