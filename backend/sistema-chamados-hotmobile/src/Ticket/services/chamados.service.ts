import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service'; 
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { StatusChamado } from '@prisma/client';

@Injectable()
export class ChamadosService {
  constructor(private readonly prisma: PrismaService) {}

  // Recebe o DTO tipado em vez de 'any'
  async create(data: CreateChamadoDto, files: Array<Express.Multer.File>) {
    
    // NÃO precisa mais daquela função 'normalizeArray'.
    // O DTO já garantiu que 'emails' e 'telefones' são arrays.

    const chamado = await this.prisma.chamado.create({
      data: {
        nomeEmpresa: data.nome,     // acessa direto do DTO
        servico: data.servico,
        descricao: data.descricao,
        
        emails: {
          create: data.emails.map((email) => ({ endereco: email })),
        },
        telefones: {
          create: data.telefones.map((tel) => ({ numero: tel })),
        },
        anexos: {
          create: files ? files.map((file) => ({
            nomeOriginal: file.originalname,
            nomeArquivo: file.filename,
            caminho: file.path, 
            mimetype: file.mimetype,
            tamanho: file.size,
          })) : [],
        },
      },
      include: {
        emails: true,
        telefones: true,
        anexos: true,
      },
    });

    return chamado;
  }

  async updateStatus(id: number, novoStatus: StatusChamado) {
    return this.prisma.chamado.update({
      where: { id },
      data: { status: novoStatus },
    });
}

async findAll() {
    return this.prisma.chamado.findMany({
      include: {
        emails: true,
        telefones: true,
        anexos: true,
        interacoes: { // <--- NOVO
          orderBy: { createdAt: 'asc' } // As mais antigas primeiro (ordem cronológica)
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. NOVO MÉTODO: Adicionar Interação
  async addInteracao(chamadoId: number, data: CreateInteracaoDto) {
    return this.prisma.interacao.create({
      data: {
        texto: data.texto,
        autor: data.autor,
        chamadoId: chamadoId
      }
    });
  }

  async findOne(id: number) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        emails: true,
        telefones: true,
        anexos: true,
        interacoes: {
          orderBy: { createdAt: 'asc' }, // Histórico na ordem correta
        },
      },
    });

    if (!chamado) {
      throw new Error('Chamado não encontrado');
    }

    return chamado;
  }
}
