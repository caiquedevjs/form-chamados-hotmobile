-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- AlterTable
ALTER TABLE "chamados" ADD COLUMN     "prioridade" "Prioridade" NOT NULL DEFAULT 'BAIXA';
