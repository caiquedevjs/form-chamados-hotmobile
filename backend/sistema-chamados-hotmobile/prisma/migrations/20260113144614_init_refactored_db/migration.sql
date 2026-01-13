-- AlterTable
ALTER TABLE "chamados" ADD COLUMN     "responsavel" TEXT,
ADD COLUMN     "responsavelCor" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "cor" TEXT NOT NULL DEFAULT '#1976d2';
