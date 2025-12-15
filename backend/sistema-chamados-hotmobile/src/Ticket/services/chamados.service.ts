/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service'; 
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { StatusChamado } from '@prisma/client';
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from 'date-fns';
import { ChamadosGateway } from './chamados.gateway';
import { MailService } from './mail.service';
import { WhatsappService } from './whatsapp.service';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChamadosGateway,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(data: CreateChamadoDto, files: Array<Express.Multer.File>) {
    let anexosData: any[] = [];
    
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.supabaseService.uploadFile(
            file.buffer, 
            file.originalname
          );

          return {
            nomeOriginal: file.originalname,
            nomeArquivo: file.originalname,
            caminho: publicUrl,
            mimetype: file.mimetype,
            tamanho: file.size,
          };
        })
      );
    }

    const chamado = await this.prisma.chamado.create({
      data: {
        nomeEmpresa: data.nome,
        servico: data.servico,
        descricao: data.descricao,
        // Ao criar, começa com 0 não lidas (padrão do banco)
        
        emails: {
          create: data.emails.map((email) => ({ endereco: email })),
        },
        telefones: {
          create: data.telefones.map((tel) => ({ numero: tel })),
        },
        anexos: {
          create: anexosData,
        },
      },
      include: {
        emails: true,
        telefones: true,
        anexos: true,
        interacoes: true
      },
    });

    this.gateway.emitirNovoChamado(chamado);

    return chamado;
  }

  async updateStatus(id: number, novoStatus: StatusChamado) {
    const chamadoAtualizado = await this.prisma.chamado.update({
      where: { id },
      data: { status: novoStatus },
      include: { emails: true, telefones: true } 
    });

    if (novoStatus === 'EM_ATENDIMENTO') {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const linkFrontend = `${baseUrl}/acompanhamento/${id}`;

      if (chamadoAtualizado.emails && chamadoAtualizado.emails.length > 0) {
        const promessasEmail = chamadoAtualizado.emails.map(email => 
          this.mailService.enviarAvisoInicioAtendimento(
            email.endereco, 
            chamadoAtualizado.nomeEmpresa, 
            linkFrontend
          )
        );
        Promise.all(promessasEmail).catch(err => console.error('Erro email:', err));
      }

      if (chamadoAtualizado.telefones && chamadoAtualizado.telefones.length > 0) {
        const promessasZap = chamadoAtualizado.telefones.map(tel => 
          this.whatsappService.enviarAvisoInicioAtendimento(
            tel.numero, 
            chamadoAtualizado.nomeEmpresa, 
            linkFrontend
          )
        );
        Promise.all(promessasZap).catch(err => console.error('Erro zap:', err));
      }
    }
    this.gateway.emitirMudancaStatus(id, novoStatus);

    return chamadoAtualizado;
  }

  async findAll() {
    return this.prisma.chamado.findMany({
      include: {
        emails: true,
        telefones: true,
        anexos: true,
        interacoes: {
          orderBy: { createdAt: 'asc' },
          include: { anexos: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ MÉTODO ATUALIZADO COM CONTADOR
  async addInteracao(chamadoId: number, data: CreateInteracaoDto, files?: Array<Express.Multer.File>) {
    
    let anexosData: any[] = [];

    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.supabaseService.uploadFile(
            file.buffer, 
            file.originalname
          );

          return {
            nomeOriginal: file.originalname,
            nomeArquivo: file.originalname,
            caminho: publicUrl,
            mimetype: file.mimetype,
            tamanho: file.size,
            chamadoId: chamadoId 
          };
        })
      );
    }
    
    // 1. Cria a interação
    const novaInteracao = await this.prisma.interacao.create({
      data: {
        texto: data.texto,
        autor: data.autor,
        chamadoId: chamadoId,
        anexos: {
          create: anexosData,
        },
      },
      include: {
        anexos: true,
      }
    });

    // 2. LÓGICA DE CONTADOR: Se for CLIENTE, incrementa mensagensNaoLidas
    if (data.autor === 'CLIENTE') {
      await this.prisma.chamado.update({
        where: { id: chamadoId },
        data: {
          mensagensNaoLidas: { increment: 1 } // Soma 1 ao valor atual
        }
      });
    }

    this.gateway.emitirNovaInteracao(chamadoId, novaInteracao);

    return novaInteracao;
  }

  // ✅ MÉTODO ATUALIZADO PARA ZERAR
  async findOne(id: number) {
    
    // 1. Zera o contador ao abrir o chamado (Admin leu)
    await this.prisma.chamado.update({
      where: { id },
      data: { mensagensNaoLidas: 0 }
    }).catch(() => {}); // Catch silencioso caso dê erro no update, mas não trava o fluxo

    // 2. Busca os dados
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        emails: true,
        telefones: true,
        anexos: true,
        interacoes: {
          orderBy: { createdAt: 'asc' },
          include: { anexos: true }
        },
      },
    });

    if (!chamado) {
      throw new Error('Chamado não encontrado');
    }

    return chamado;
  }

  async getDashboardMetrics(startStr?: string, endStr?: string) {
    const endDate = endStr ? endOfDay(parseISO(endStr)) : endOfDay(new Date());
    const startDate = startStr ? startOfDay(parseISO(startStr)) : startOfDay(new Date(new Date().setDate(new Date().getDate() - 7)));

    const totalGeral = await this.prisma.chamado.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const totalFinalizados = await this.prisma.chamado.count({ 
      where: { status: 'FINALIZADO', createdAt: { gte: startDate, lte: endDate } } 
    });

    const porStatus = await this.prisma.chamado.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { status: true },
    });

    const chamadosNoPeriodo = await this.prisma.chamado.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    });

    const diasDoIntervalo = eachDayOfInterval({ start: startDate, end: endDate });
    
    const graficoTimeline = diasDoIntervalo.map((dia) => {
      const diaFormatadoISO = format(dia, 'yyyy-MM-dd');
      const diaFormatadoExibicao = format(dia, 'dd/MM');

      const quantidade = chamadosNoPeriodo.filter(c => 
        format(c.createdAt, 'yyyy-MM-dd') === diaFormatadoISO
      ).length;

      return { name: diaFormatadoExibicao, chamados: quantidade };
    });

    return {
      statusData: porStatus.map(s => ({ name: s.status, value: s._count.status })),
      timelineData: graficoTimeline,
      kpis: {
        total: totalGeral,
        finalizados: totalFinalizados,
        pendentes: totalGeral - totalFinalizados
      }
    };
  }
}