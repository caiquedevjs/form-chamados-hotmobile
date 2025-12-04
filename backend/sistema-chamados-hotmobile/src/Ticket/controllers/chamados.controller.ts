import { 
  Controller, 
  Post, 
  Body, 
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
}