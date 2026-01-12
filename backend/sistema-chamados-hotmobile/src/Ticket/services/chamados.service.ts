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
import { StatusChamado } from '@prisma/client';
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from 'date-fns';
import { ChamadosGateway } from './chamados.gateway';
import { MailService } from './mail.service';
import { WhatsappService } from './whatsapp.service';
// ❌ REMOVA: import { SupabaseService } ...
// ✅ ADICIONE:
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
          // ✅ AGORA USA O SERVIÇO GENÉRICO (Não sabe se é Supabase ou AWS)
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          
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
        emails: { create: data.emails.map((email) => ({ endereco: email })) },
        telefones: { create: data.telefones.map((tel) => ({ numero: tel })) },
        anexos: { create: anexosData },
      },
      include: { emails: true, telefones: true, anexos: true, interacoes: true },
    });

    this.gateway.emitirNovoChamado(chamado);
    return chamado;
  }

  // ... (updateStatus MANTIDO IGUAL - Não muda nada aqui) ...
  async updateStatus(id: number, novoStatus: StatusChamado) {
    const chamadoAtualizado = await this.prisma.chamado.update({
      where: { id },
      data: { status: novoStatus },
      include: { emails: true, telefones: true } 
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${id}`;

    if (novoStatus === 'EM_ATENDIMENTO') {
      if (chamadoAtualizado.emails?.length > 0) {
        const promessasEmail = chamadoAtualizado.emails.map(email => 
          this.mailService.enviarAvisoInicioAtendimento(email.endereco, chamadoAtualizado.nomeEmpresa, linkFrontend)
        );
        Promise.all(promessasEmail).catch(err => console.error('Erro email atendimento:', err));
      }
      if (chamadoAtualizado.telefones?.length > 0) {
        const promessasZap = chamadoAtualizado.telefones.map(tel => 
          this.whatsappService.enviarAvisoInicioAtendimento(tel.numero, chamadoAtualizado.nomeEmpresa, linkFrontend)
        );
        Promise.all(promessasZap).catch(err => console.error('Erro zap atendimento:', err));
      }
    }

    if (novoStatus === 'FINALIZADO') {
      const mensagemFinal = `Olá! O chamado #${id} da empresa *${chamadoAtualizado.nomeEmpresa}* foi finalizado. Caso precise de mais ajuda, por favor, abra um novo chamado.`;

      if (chamadoAtualizado.emails?.length > 0) {
        const promessasEmail = chamadoAtualizado.emails.map(email => 
          this.mailService.enviarNotificacaoGenerica(email.endereco, `Chamado #${id} Finalizado`, mensagemFinal, linkFrontend)
        );
        Promise.all(promessasEmail).catch(err => console.error('Erro email finalização:', err));
      }

      if (chamadoAtualizado.telefones?.length > 0) {
        const promessasZap = chamadoAtualizado.telefones.map(tel => 
          this.whatsappService.enviarMensagem(tel.numero, mensagemFinal)
        );
        Promise.all(promessasZap).catch(err => console.error('Erro zap finalização:', err));
      }
    }

    this.gateway.emitirMudancaStatus(id, novoStatus);
    return chamadoAtualizado;
  }

  // ... (findAll MANTIDO IGUAL) ...
  async findAll() {
    return this.prisma.chamado.findMany({
      include: {
        emails: true, telefones: true, anexos: true,
        interacoes: { orderBy: { createdAt: 'asc' }, include: { anexos: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addInteracao(chamadoId: number, data: CreateInteracaoDto, files?: Array<Express.Multer.File>) {
    let anexosData: any[] = [];
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          // ✅ AQUI TAMBÉM: USA O SERVIÇO GENÉRICO
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          
          return {
            nomeOriginal: file.originalname, nomeArquivo: file.originalname, caminho: publicUrl, mimetype: file.mimetype, tamanho: file.size, chamadoId: chamadoId 
          };
        })
      );
    }
    
    const novaInteracao = await this.prisma.interacao.create({
      data: {
        texto: data.texto,
        autor: data.autor,
        chamadoId: chamadoId,
        anexos: { create: anexosData },
      },
      include: { anexos: true }
    });

    if (data.autor === 'CLIENTE') {
      await this.prisma.chamado.update({
        where: { id: chamadoId },
        data: { mensagensNaoLidas: { increment: 1 } }
      });
    }

    if (data.autor === 'SUPORTE') {
        const chamadoPai = await this.prisma.chamado.findUnique({
            where: { id: chamadoId },
            include: { emails: true, telefones: true }
        });

        if (chamadoPai) {
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const linkFrontend = `${baseUrl}/acompanhamento/${chamadoId}`;
            const msgNotificacao = `O suporte respondeu ao chamado #${chamadoId}: "${data.texto.substring(0, 50)}${data.texto.length > 50 ? '...' : ''}". Acesse para ver: ${linkFrontend}`;

            if (chamadoPai.telefones?.length > 0) {
                chamadoPai.telefones.forEach(tel => {
                    this.whatsappService.enviarMensagem(tel.numero, msgNotificacao)
                        .catch(err => console.error('Erro zap resposta:', err));
                });
            }

            if (chamadoPai.emails?.length > 0) {
                chamadoPai.emails.forEach(email => {
                    this.mailService.enviarNotificacaoGenerica(
                        email.endereco, 
                        `Nova resposta no Chamado #${chamadoId}`, 
                        `O suporte respondeu: "${data.texto}"`,
                        linkFrontend
                    ).catch(err => console.error('Erro email resposta:', err));
                });
            }
        }
    }

    this.gateway.emitirNovaInteracao(chamadoId, novaInteracao);
    return novaInteracao;
  }

  // ... (findOne e getDashboardMetrics MANTIDOS IGUAIS) ...
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