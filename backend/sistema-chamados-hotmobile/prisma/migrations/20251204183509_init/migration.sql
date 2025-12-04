-- CreateEnum
CREATE TYPE "TipoAutor" AS ENUM ('CLIENTE', 'SUPORTE');

-- CreateTable
CREATE TABLE "interacoes" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "autor" "TipoAutor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chamadoId" INTEGER NOT NULL,

    CONSTRAINT "interacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
