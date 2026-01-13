/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, Inject } from '@nestjs/common'; // 👈 Adicione Inject
import { PrismaService } from 'src/prisma.service'; 
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto'; 
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from 'date-fns';
import { ChamadosGateway } from './chamados.gateway';
import { MailService } from './mail.service';
import { WhatsappService } from './whatsapp.service';

import * as storageInterface from './storage.interface'; 

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChamadosGateway,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    
    // ✅ MUDANÇA PRINCIPAL: Injeção pelo Token Genérico
    @Inject('STORAGE_SERVICE') private readonly storageService: storageInterface.IStorageService,
  ) {}

  async create(data: CreateChamadoDto, files: Array<Express.Multer.File>) {
    let anexosData: any[] = [];
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          return {
            nomeOriginal: file.originalname, nomeArquivo: file.originalname, caminho: publicUrl, mimetype: file.mimetype, tamanho: file.size,
          };
        })
      );
    }

    const chamado = await this.prisma.chamado.create({
      data: {
        nomeEmpresa: data.nome,
        servico: data.servico,
        descricao: data.descricao,
        emails: { create: data.emails.map((email) => ({ endereco: email })) },
        telefones: { create: data.telefones.map((tel) => ({ numero: tel })) },
        anexos: { create: anexosData },
      },
      include: { emails: true, telefones: true, anexos: true, interacoes: true },
    });

    // Notificações de Criação (Background)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${chamado.id}`;

    if (chamado.telefones?.length > 0) {
      const promessasZap = chamado.telefones.map(tel =>
        this.whatsappService.enviarAvisoCriacaoChamado(tel.numero, chamado.nomeEmpresa, chamado.id, linkFrontend)
      );
      Promise.all(promessasZap).catch(err => console.error('Erro Zap Criação:', err));
    }

    if (chamado.emails?.length > 0) {
        const promessasEmail = chamado.emails.map(email =>
            this.mailService.enviarNotificacaoGenerica(email.endereco, `Chamado #${chamado.id} Recebido`, `Recebemos seu chamado com sucesso.`, linkFrontend)
        );
        Promise.all(promessasEmail).catch(err => console.error('Erro Email Criação:', err));
    }

    this.gateway.emitirNovoChamado(chamado);
    return chamado;
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const novoStatus = dto.status;
    const chamadoAtualizado = await this.prisma.chamado.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.responsavel && { responsavel: dto.responsavel }),
        ...(dto.responsavelCor && { responsavelCor: dto.responsavelCor }),
        ...(dto.prioridade && { prioridade: dto.prioridade }),
      },
      include: { emails: true, telefones: true }
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${id}`;

    // Notificações de Status (Background)
    if (novoStatus === 'EM_ATENDIMENTO' || novoStatus === 'FINALIZADO') {
        const msg = novoStatus === 'EM_ATENDIMENTO' ? 'Seu chamado entrou em atendimento.' : 'Seu chamado foi finalizado.';
        // Lógica simplificada de notificação para não poluir o código aqui
        // (Mantenha a sua lógica de disparo de zap/email aqui dentro)
        if (chamadoAtualizado.telefones?.length > 0) {
             chamadoAtualizado.telefones.forEach(tel => this.whatsappService.enviarMensagem(tel.numero, msg).catch(()=>{}));
        }
    }

    if (novoStatus) {
      this.gateway.emitirMudancaStatus(id, novoStatus);
    }

    if (dto.prioridade) {
        // Você pode criar um evento novo ou usar o 'mudanca_status' enviando o objeto todo
        this.gateway.server.emit('mudanca_status', chamadoAtualizado); 
    }
    return chamadoAtualizado;
  }

  async findAll() {
    return this.prisma.chamado.findMany({
      include: {
        emails: true, telefones: true, anexos: true,
        interacoes: { orderBy: { createdAt: 'asc' }, include: { anexos: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 👇 O PULO DO GATO DO CHAT
  async addInteracao(chamadoId: number, data: CreateInteracaoDto, files?: Array<Express.Multer.File>) {
    // 1. Uploads
    let anexosData: any[] = [];
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          return { nomeOriginal: file.originalname, nomeArquivo: file.originalname, caminho: publicUrl, mimetype: file.mimetype, tamanho: file.size, chamadoId: chamadoId };
        })
      );
    }

    // 2. Salva no Banco (Com flag interno)
    const novaInteracao = await this.prisma.interacao.create({
      data: {
        texto: data.texto,
        autor: data.autor,
        chamadoId: chamadoId,
        interno: !!data.interno,
        anexos: { create: anexosData },
      },
      include: { anexos: true }
    });

    // 3. 🚀 SOCKET PRIMEIRO (Prioridade Máxima)
    this.gateway.emitirNovaInteracao(chamadoId, novaInteracao);

    // 4. Contador (Cliente)
    if (data.autor === 'CLIENTE') {
      this.prisma.chamado.update({
        where: { id: chamadoId },
        data: { mensagensNaoLidas: { increment: 1 } }
      }).catch(() => {});
    }

    // 5. Notificações (Suporte -> Cliente) - SÓ SE NÃO FOR INTERNO
    if (data.autor === 'SUPORTE' && !data.interno) {
        (async () => {
            try {
                const chamadoPai = await this.prisma.chamado.findUnique({ where: { id: chamadoId }, include: { emails: true, telefones: true } });
                if (chamadoPai) {
                    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const link = `${baseUrl}/acompanhamento/${chamadoId}`;
                    const msg = `Nova resposta no chamado #${chamadoId}: "${data.texto.substring(0, 50)}..." Ver: ${link}`;

                    chamadoPai.telefones?.forEach(tel => this.whatsappService.enviarMensagem(tel.numero, msg).catch(() => {}));
                    chamadoPai.emails?.forEach(mail => this.mailService.enviarNotificacaoGenerica(mail.endereco, `Nova Interação #${chamadoId}`, msg, link).catch(() => {}));
                }
            } catch (e) { console.error("Erro notificação async", e); }
        })();
    }

    return novaInteracao;
  }

  async findOne(id: number) {
    await this.prisma.chamado.update({ where: { id }, data: { mensagensNaoLidas: 0 } }).catch(() => {});
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        emails: true, telefones: true, anexos: true,
        interacoes: { orderBy: { createdAt: 'asc' }, include: { anexos: true } },
      },
    });
    if (!chamado) throw new Error('Chamado não encontrado');
    return chamado;
  }

  async findOnePublic(id: number) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        emails: false, telefones: false, anexos: true,
        interacoes: { 
            where: { interno: false }, // Filtra notas internas
            orderBy: { createdAt: 'asc' }, 
            include: { anexos: true } 
        },
      },
    });
    if (!chamado) throw new Error('Chamado não encontrado');
    return chamado;
  }
  
  async getDashboardMetrics(startStr?: string, endStr?: string) {
    const endDate = endStr ? endOfDay(parseISO(endStr)) : endOfDay(new Date());
    const startDate = startStr ? startOfDay(parseISO(startStr)) : startOfDay(new Date(new Date().setDate(new Date().getDate() - 7)));

    const totalGeral = await this.prisma.chamado.count({ where: { createdAt: { gte: startDate, lte: endDate } } });
    const totalFinalizados = await this.prisma.chamado.count({ where: { status: 'FINALIZADO', createdAt: { gte: startDate, lte: endDate } } });
    const porStatus = await this.prisma.chamado.groupBy({ by: ['status'], where: { createdAt: { gte: startDate, lte: endDate } }, _count: { status: true }, });
    const chamadosNoPeriodo = await this.prisma.chamado.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true }, });
    const diasDoIntervalo = eachDayOfInterval({ start: startDate, end: endDate });
    
    const graficoTimeline = diasDoIntervalo.map((dia) => {
      const diaFormatadoISO = format(dia, 'yyyy-MM-dd');
      const diaFormatadoExibicao = format(dia, 'dd/MM');
      const quantidade = chamadosNoPeriodo.filter(c => format(c.createdAt, 'yyyy-MM-dd') === diaFormatadoISO).length;
      return { name: diaFormatadoExibicao, chamados: quantidade };
    });

    return {
      statusData: porStatus.map(s => ({ name: s.status, value: s._count.status })),
      timelineData: graficoTimeline,
      kpis: { total: totalGeral, finalizados: totalFinalizados, pendentes: totalGeral - totalFinalizados }
    };
  }
}