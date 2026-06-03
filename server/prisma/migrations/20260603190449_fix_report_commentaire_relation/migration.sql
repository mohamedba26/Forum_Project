-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_commentaireId_fkey" FOREIGN KEY ("commentaireId") REFERENCES "commentaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
