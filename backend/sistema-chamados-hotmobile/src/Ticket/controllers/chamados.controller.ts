import { 
  Controller, 
  Post,
  Get,
  Body, 
  Query,
  UploadedFiles, 
  UseInterceptors, 
  UsePipes, 
  ValidationPipe 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChamadosService } from '../services/chamados.service'; 
import { CreateChamadoDto } from '../dtos/create-chamado.dto'; // Importe seu DTO
import { Patch, Param, ParseIntPipe } from '@nestjs/common'; // Adicione esses imports
import { UpdateStatusDto } from '../dtos/update-status.dto'; // Importe o DTO
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';


@Controller('chamados')
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('arquivos', 10, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  // ATENÇÃO: transform: true é obrigatório para o @Transform do DTO funcionar
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) 
  async create(
    @Body() createChamadoDto: CreateChamadoDto, // Trocamos 'any' pelo DTO
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    // --- ADICIONE ISSO AQUI ---
    console.log('📂 Arquivos recebidos:', files); 
    console.log('📝 Body recebido:', Body);
    return this.chamadosService.create(createChamadoDto, files);
  }
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto
  ) {
    return this.chamadosService.updateStatus(id, body.status);
  }

  @Get()
  async findAll() {
    return this.chamadosService.findAll();
  }

  @Post(':id/interacoes')
  @UseInterceptors(FilesInterceptor('files', 5, { // Aceita até 5 arquivos
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async addInteracao(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateInteracaoDto,
    @UploadedFiles() files: Array<Express.Multer.File> // <--- Recebe os arquivos
  ) {
    // Passamos os arquivos para o service
    return this.chamadosService.addInteracao(id, body, files);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.findOne(id);
  }

 @Get('dashboard/metrics')
  async getMetrics(
    @Query('start') start?: string, 
    @Query('end') end?: string
  ) {
    return this.chamadosService.getDashboardMetrics(start, end);
  }
}