-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#2196F3',

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChamadoToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_nome_key" ON "tags"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "_ChamadoToTag_AB_unique" ON "_ChamadoToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ChamadoToTag_B_index" ON "_ChamadoToTag"("B");

-- AddForeignKey
ALTER TABLE "_ChamadoToTag" ADD CONSTRAINT "_ChamadoToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChamadoToTag" ADD CONSTRAINT "_ChamadoToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
