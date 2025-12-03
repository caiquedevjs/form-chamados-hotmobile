import { Module } from '@nestjs/common';
import { ChamadosController } from '../controllers/chamados.controller';
import { ChamadosService } from '../services/chamados.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [],
  controllers: [ChamadosController],
  providers: [ChamadosService, PrismaService],
})
export class ChamadosModule {}
