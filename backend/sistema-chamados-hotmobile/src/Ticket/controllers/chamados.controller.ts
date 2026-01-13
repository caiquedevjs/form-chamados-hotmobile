import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChamadosService } from '../services/chamados.service';
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto'; // Verifique se este DTO tem os campos novos (responsavel, cor)
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
    // ✅ CORREÇÃO AQUI: Passa o 'body' inteiro
    return this.chamadosService.updateStatus(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.chamadosService.findAll();
  }

  @Post(':id/interacoes')
  @UseInterceptors(FilesInterceptor('files', 5))
  async addInteracao(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateInteracaoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.chamadosService.addInteracao(id, body, files);
  }

 // Rota do Admin (Com AuthGuard, vê tudo)
  @UseGuards(AuthGuard('jwt')) 
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOne(id);
  }

  
// 👇 NOVA ROTA PÚBLICA (Cliente acessa esta)
  // Sem AuthGuard (ou validação leve)
  @Get('public/:id')
  async findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOnePublic(id);
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/metrics')
  async getMetrics(@Query('start') start?: string, @Query('end') end?: string) {
    return this.chamadosService.getDashboardMetrics(start, end);
  }
}