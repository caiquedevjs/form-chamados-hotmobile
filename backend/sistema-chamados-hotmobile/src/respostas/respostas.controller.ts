import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('respostas-prontas')
@UseGuards(AuthGuard('jwt')) // Apenas admins podem mexer nisso
export class RespostasController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() data: CreateRespostaDto) {
    return this.prisma.respostaPronta.create({ data });
  }

  @Get()
  async findAll() {
    return this.prisma.respostaPronta.findMany({
      orderBy: { titulo: 'asc' }
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.respostaPronta.delete({ where: { id } });
  }
}