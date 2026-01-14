import {
  Controller, Post, Get, Delete, Body, Query, UploadedFiles, UseInterceptors,
  UsePipes, ValidationPipe, UseGuards, Patch, Param, ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChamadosService } from '../services/chamados.service';
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('chamados')
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('arquivos', 10))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createChamadoDto: CreateChamadoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.chamadosService.create(createChamadoDto, files);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
  ) {
    return this.chamadosService.updateStatus(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.chamadosService.findAll();
  }

  // 🔓 ROTA PÚBLICA: Permite cliente enviar mensagem sem login
  @Post(':id/interacoes')
  @UseInterceptors(FilesInterceptor('files', 5))
  async addInteracao(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateInteracaoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.chamadosService.addInteracao(id, body, files);
  }

  // 🔒 ROTA PRIVADA: Admin vê tudo
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOne(id);
  }

  // 🔓 ROTA PÚBLICA: Cliente vê apenas o necessário
  @Get('public/:id')
  async findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOnePublic(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/metrics')
  async getMetrics(@Query('start') start?: string, @Query('end') end?: string) {
    return this.chamadosService.getDashboardMetrics(start, end);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.remove(id);
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('tags/list') // Rota para listar todas as tags disponíveis
  async listarTags() {
    return this.chamadosService.getTags();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tags') // Rota para criar nova tag
  async criarTag(@Body() body: { nome: string, cor: string }) {
    return this.chamadosService.createTag(body.nome, body.cor);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/tags') // Rota para atualizar tags do chamado
  async atualizarTags(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { tagIds: number[] }
  ) {
    return this.chamadosService.updateChamadoTags(id, body.tagIds);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('tags/:id')
  async deletarTag(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.deleteTag(id);
  }
}