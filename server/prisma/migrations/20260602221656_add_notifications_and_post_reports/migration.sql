-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "posteId" INTEGER;

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinataireId" INTEGER NOT NULL,
    "reportId" INTEGER,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
