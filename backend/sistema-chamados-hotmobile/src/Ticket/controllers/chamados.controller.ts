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
// Removidos: diskStorage e extname (não precisamos mais salvar no disco local)
import { ChamadosService } from '../services/chamados.service';
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('chamados')
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Post()
  // 👇 MUDANÇA 1: Removemos o diskStorage. Agora ele guarda na Memória RAM.
  @UseInterceptors(FilesInterceptor('arquivos', 10))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createChamadoDto: CreateChamadoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    // Agora 'files' terá a propriedade .buffer preenchida!
    return this.chamadosService.create(createChamadoDto, files);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
  ) {
    return this.chamadosService.updateStatus(id, body.status);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.chamadosService.findAll();
  }

  @Post(':id/interacoes')
  // 👇 MUDANÇA 2: Mesma coisa aqui. Removemos o diskStorage.
  @UseInterceptors(FilesInterceptor('files', 5))
  async addInteracao(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateInteracaoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.chamadosService.addInteracao(id, body, files);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/metrics')
  async getMetrics(@Query('start') start?: string, @Query('end') end?: string) {
    return this.chamadosService.getDashboardMetrics(start, end);
  }
}
