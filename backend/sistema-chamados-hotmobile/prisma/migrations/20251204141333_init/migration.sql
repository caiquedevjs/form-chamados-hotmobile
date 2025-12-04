-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('NOVO', 'EM_ATENDIMENTO', 'FINALIZADO');

-- AlterTable
ALTER TABLE "chamados" ADD COLUMN     "status" "StatusChamado" NOT NULL DEFAULT 'NOVO';
