-- AlterTable
ALTER TABLE "anexos" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "interacaoId" INTEGER;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_interacaoId_fkey" FOREIGN KEY ("interacaoId") REFERENCES "interacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
