-- AlterTable
ALTER TABLE "commentaire_likes" ADD COLUMN     "reaction" TEXT NOT NULL DEFAULT '👍';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "posteId" INTEGER;

-- AlterTable
ALTER TABLE "poste_likes" ADD COLUMN     "reaction" TEXT NOT NULL DEFAULT '👍';
