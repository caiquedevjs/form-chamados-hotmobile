import {
  Controller, Post, Get, Delete, Body, Query, UploadedFiles, UseInterceptors,
  UsePipes, ValidationPipe, UseGuards, Patch, Param, ParseIntPipe, BadRequestException,
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

  // ✅ 1. ROTA DE CRIAÇÃO (FORMULÁRIO INICIAL)
  // Adicionada validação para aceitar ÁUDIO (.webm, .mp3, etc)
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, { // 'files' deve bater com o frontend
    fileFilter: (req, file, callback) => {
      // Regex atualizada para incluir extensões de áudio
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|mp3|wav|webm|ogg)$/)) {
        return callback(new BadRequestException('Formato inválido! Permitido: Imagens, PDF e Áudio.'), false);
      }
      callback(null, true);
    }
  }))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createChamadoDto: CreateChamadoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.chamadosService.create(createChamadoDto, files);
  }

  // ✅ 2. ROTA DE INTERAÇÃO (RESPOSTAS/CHAT)
  // Também atualizada para aceitar áudio nas respostas
  @Post(':id/interacoes')
  @UseInterceptors(FilesInterceptor('files', 5, {
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|mp3|wav|webm|ogg)$/)) {
        return callback(new BadRequestException('Formato inválido! Permitido: Imagens, PDF e Áudio.'), false);
      }
      callback(null, true);
    }
  }))
  async addInteracao(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateInteracaoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.chamadosService.addInteracao(id, body, files);
  }

  // --- DEMAIS ROTAS (MANTIDAS IGUAIS) ---

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

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOne(id);
  }

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

  // --- TAGS ---

  @UseGuards(AuthGuard('jwt'))
  @Get('tags/list')
  async listarTags() {
    return this.chamadosService.getTags();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tags')
  async criarTag(@Body() body: { nome: string, cor: string }) {
    return this.chamadosService.createTag(body.nome, body.cor);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/tags')
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

  @UseGuards(AuthGuard('jwt'))
  @Patch('tags/:id')
  async atualizarTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { cor: string }
  ) {
    return this.chamadosService.updateTag(id, body);
  }

  @Patch(':id/responsavel')
  async updateResponsavel(
    @Param('id') id: string, 
    @Body() body: { responsavel: string, responsavelCor: string }
  ) {
    return this.chamadosService.updateResponsavel(Number(id), body.responsavel, body.responsavelCor);
  }
}