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


    // 👇 2. NOVA LÓGICA: Enviar notificação de "Recebido com Sucesso"
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${chamado.id}`;

    // Dispara WhatsApp
    if (chamado.telefones?.length > 0) {
      const promessasZap = chamado.telefones.map(tel => 
        this.whatsappService.enviarAvisoCriacaoChamado(
            tel.numero, 
            chamado.nomeEmpresa, 
            chamado.id, 
            linkFrontend
        )
      );
      // "Fire and forget": Não usamos await aqui pro cliente não ficar esperando o zap chegar pra tela liberar
      Promise.all(promessasZap).catch(err => console.error('Erro ao enviar zap de criação:', err));
    }

    // Dispara Email (Opcional, se quiser avisar por email também)
    if (chamado.emails?.length > 0) {
        const promessasEmail = chamado.emails.map(email => 
            this.mailService.enviarNotificacaoGenerica(
                email.endereco,
                `Chamado #${chamado.id} Recebido`,
                `Olá ${chamado.nomeEmpresa}, recebemos seu chamado com sucesso. Aguarde atendimento.`,
                linkFrontend
            )
        );
        Promise.all(promessasEmail).catch(err => console.error('Erro ao enviar email de criação:', err));
    }

    this.gateway.emitirNovoChamado(chamado);
    return chamado;
  }

  // ... (updateStatus MANTIDO IGUAL - Não muda nada aqui) ...
 // ✅ CORREÇÃO: Recebe o DTO completo, não só a string
  async updateStatus(id: number, dto: UpdateStatusDto) {
    
    // Captura o status novo para usar nas notificações abaixo
    const novoStatus = dto.status;

    const chamadoAtualizado = await this.prisma.chamado.update({
      where: { id },
      data: { 
        // ✅ Agora usa 'dto' corretamente
        ...(dto.status && { status: dto.status }),
        ...(dto.responsavel && { responsavel: dto.responsavel }),
        ...(dto.responsavelCor && { responsavelCor: dto.responsavelCor }),
       },
      include: { emails: true, telefones: true } 
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${id}`;

    // ✅ Verifica se o status mudou antes de notificar
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

    // Se houve mudança de status, emite o evento
    if (novoStatus) {
        this.gateway.emitirMudancaStatus(id, novoStatus);
    }
    
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
    // 1. Uploads (Mantido igual)
    let anexosData: any[] = [];
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          return {
            nomeOriginal: file.originalname, nomeArquivo: file.originalname, caminho: publicUrl, mimetype: file.mimetype, tamanho: file.size, chamadoId: chamadoId 
          };
        })
      );
    }
    
    // 2. Salva no Banco (Mantido igual)
    const novaInteracao = await this.prisma.interacao.create({
      data: {
        texto: data.texto,
        autor: data.autor,
        chamadoId: chamadoId,
        anexos: { create: anexosData },
      },
      include: { anexos: true }
    });

    // 🚀 O PULO DO GATO ESTÁ AQUI 🚀
    // Chamamos o Gateway AGORA. Não esperamos nada mais.
    // O usuário vai ver a mensagem na tela em milissegundos.
    this.gateway.emitirNovaInteracao(chamadoId, novaInteracao);

    // -----------------------------------------------------------
    // DAQUI PRA BAIXO É "BACKGROUND" (Não trava o chat)
    // -----------------------------------------------------------

    // 3. Atualiza contador (sem await para não bloquear)
    if (data.autor === 'CLIENTE') {
      this.prisma.chamado.update({
        where: { id: chamadoId },
        data: { mensagensNaoLidas: { increment: 1 } }
      }).catch(err => console.error("Erro contador:", err));
    }

    // 4. Notificações (Envolvidas em async/catch para não quebrar o fluxo)
    if (data.autor === 'SUPORTE') {
        (async () => {
            try {
                const chamadoPai = await this.prisma.chamado.findUnique({
                    where: { id: chamadoId },
                    include: { emails: true, telefones: true }
                });

                if (chamadoPai) {
                    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const linkFrontend = `${baseUrl}/acompanhamento/${chamadoId}`;
                    const msgNotificacao = `O suporte respondeu ao chamado #${chamadoId}: "${data.texto.substring(0, 50)}${data.texto.length > 50 ? '...' : ''}". Acesse: ${linkFrontend}`;

                    // Dispara Zap
                    if (chamadoPai.telefones?.length > 0) {
                        chamadoPai.telefones.forEach(tel => {
                            this.whatsappService.enviarMensagem(tel.numero, msgNotificacao)
                                .catch(e => console.error('Erro Zap Async:', e));
                        });
                    }

                    // Dispara Email
                    if (chamadoPai.emails?.length > 0) {
                        chamadoPai.emails.forEach(email => {
                            this.mailService.enviarNotificacaoGenerica(
                                email.endereco, 
                                `Nova resposta no Chamado #${chamadoId}`, 
                                `O suporte respondeu: "${data.texto}"`,
                                linkFrontend
                            ).catch(e => console.error('Erro Email Async:', e));
                        });
                    }
                }
            } catch (error) {
                console.error("Erro interno nas notificações:", error);
            }
        })();
    }

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