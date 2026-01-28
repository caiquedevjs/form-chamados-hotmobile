import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service'; 
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto'; 
import { ChamadosGateway } from './chamados.gateway';
import { MailService } from './mail.service';
import { WhatsappService } from './whatsapp.service';
import * as storageInterface from './storage.interface'; 
import { 
  startOfDay, 
  endOfDay, 
  parseISO, 
  format, 
  differenceInHours, // 👈 Adicione este aqui
  eachDayOfInterval 
} from 'date-fns';

@Injectable()
export class ChamadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChamadosGateway,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    @Inject('STORAGE_SERVICE') private readonly storageService: storageInterface.IStorageService,
  ) {}

  async create(data: CreateChamadoDto, files: Array<Express.Multer.File>) {
    let anexosData: any[] = [];
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          return { nomeOriginal: file.originalname, nomeArquivo: file.originalname, caminho: publicUrl, mimetype: file.mimetype, tamanho: file.size };
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

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${chamado.id}`;

    // Cast para any para evitar erro de tipagem estrita no build
    const chamadoAny = chamado as any;

    if (chamadoAny.telefones?.length > 0) {
      const promessasZap = chamadoAny.telefones.map((tel: any) => 
        this.whatsappService.enviarAvisoCriacaoChamado(tel.numero, chamado.nomeEmpresa, chamado.id, linkFrontend)
      );
      Promise.all(promessasZap).catch(err => console.error('Erro Zap Criação:', err));
    }

    if (chamadoAny.emails?.length > 0) {
        const promessasEmail = chamadoAny.emails.map((email: any) => 
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
        // 🚨 CORREÇÃO 1: 'as any' resolve o conflito de Enums entre DTO e Prisma
        ...(dto.status && { status: dto.status as any }),
        ...(dto.responsavel && { responsavel: dto.responsavel }),
        ...(dto.responsavelCor && { responsavelCor: dto.responsavelCor }),
        ...(dto.prioridade && { prioridade: dto.prioridade as any }), 
       },
      include: { emails: true, telefones: true } 
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkFrontend = `${baseUrl}/acompanhamento/${id}`;

    // 🚨 CORREÇÃO 2: Criamos uma variável 'any' para acessar 'telefones' e 'emails'
    // O TypeScript às vezes se perde no 'include', isso força ele a aceitar.
    const chamadoFull = chamadoAtualizado as any;

    // Notificações de Status
    if (novoStatus === 'EM_ATENDIMENTO' || novoStatus === 'FINALIZADO') {
        const msg = novoStatus === 'EM_ATENDIMENTO' ? 'Seu chamado entrou em atendimento.' : 'Seu chamado foi finalizado.';
        
        if (chamadoFull.telefones?.length > 0) {
             chamadoFull.telefones.forEach((tel: any) => 
                this.whatsappService.enviarMensagem(tel.numero, msg).catch(()=>{})
             );
        }
        
        // Exemplo para email também se quiser descomentar:
        // if (chamadoFull.emails?.length > 0) { ... }
    }

    // Se mudou status ou prioridade, avisa o front
    if (dto.status || dto.prioridade) {
      this.gateway.emitirMudancaStatus(id, dto.status || chamadoAtualizado.status);
    }
    
    return chamadoAtualizado;
  }

  async findAll() {
    return this.prisma.chamado.findMany({
      include: {
        emails: true, telefones: true, anexos: true, tags: true,
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
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          return { nomeOriginal: file.originalname, nomeArquivo: file.originalname, caminho: publicUrl, mimetype: file.mimetype, tamanho: file.size, chamadoId: chamadoId };
        })
      );
    }
    
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

    this.gateway.emitirNovaInteracao(chamadoId, novaInteracao);

    if (data.autor === 'CLIENTE') {
      this.prisma.chamado.update({
        where: { id: chamadoId },
        data: { mensagensNaoLidas: { increment: 1 } }
      }).catch(() => {});
    }

    if (data.autor === 'SUPORTE' && !data.interno) {
        (async () => {
            try {
                const chamadoPai = await this.prisma.chamado.findUnique({
                    where: { id: chamadoId },
                    include: { emails: true, telefones: true }
                });

                if (chamadoPai) {
                    const chamadoPaiAny = chamadoPai as any; // Cast para garantir acesso
                    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const linkFrontend = `${baseUrl}/acompanhamento/${chamadoId}`;
                    const msgNotificacao = `Nova resposta no chamado #${chamadoId}: "${data.texto.substring(0, 50)}..." Acesse: ${linkFrontend}`;

                    if (chamadoPaiAny.telefones?.length > 0) {
                        chamadoPaiAny.telefones.forEach((tel: any) => {
                            this.whatsappService.enviarMensagem(tel.numero, msgNotificacao).catch(() => {});
                        });
                    }
                    if (chamadoPaiAny.emails?.length > 0) {
                        chamadoPaiAny.emails.forEach((email: any) => {
                            this.mailService.enviarNotificacaoGenerica(email.endereco, `Nova Interação #${chamadoId}`, msgNotificacao, linkFrontend).catch(() => {});
                        });
                    }
                }
            } catch (error) { console.error(error); }
        })();
    }

    return novaInteracao;
  }

  async findOne(id: number) {
    await this.prisma.chamado.update({ where: { id }, data: { mensagensNaoLidas: 0 } }).catch(() => {});
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        emails: true, telefones: true, anexos: true, tags: true,
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
        emails: false, 
        telefones: false,
        anexos: true,
        interacoes: { 
            where: { interno: false }, 
            orderBy: { createdAt: 'asc' }, 
            include: { anexos: true } 
        },
      },
    });
    if (!chamado) throw new Error('Chamado não encontrado');
    return chamado;
  }

async getDashboardMetrics(startStr?: string, endStr?: string) {
    // 1. Definição do Intervalo
    const endDate = endStr ? endOfDay(parseISO(endStr)) : endOfDay(new Date());
    const startDate = startStr ? startOfDay(parseISO(startStr)) : startOfDay(new Date(new Date().setDate(new Date().getDate() - 7)));

    // 2. BUSCA ÚNICA
    const chamados = await this.prisma.chamado.findMany({
      where: { 
        createdAt: { gte: startDate, lte: endDate } 
      },
      select: {
        id: true,
        status: true,
        prioridade: true,
        responsavel: true,
        createdAt: true,
        updatedAt: true,
        tags: { 
            select: { nome: true } 
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // --- PROCESSAMENTO EM MEMÓRIA ---

    // A. Totais Básicos
    const totalGeral = chamados.length;
    const totalFinalizados = chamados.filter(c => c.status === 'FINALIZADO').length;
    const totalPendentes = totalGeral - totalFinalizados;

    // B. Cálculo de SLA
    let slaViolado = 0;
    chamados.forEach(c => {
        const dataFim = c.status === 'FINALIZADO' ? new Date(c.updatedAt) : new Date();
        const horasDecorridas = differenceInHours(dataFim, new Date(c.createdAt));

        const ehUrgente = ['ALTA', 'CRITICA'].includes(c.prioridade || '');
        if (ehUrgente && horasDecorridas > 24) {
            slaViolado++;
        }
    });
    
    const percentualSlaOk = totalGeral > 0 
        ? ((totalGeral - slaViolado) / totalGeral * 100).toFixed(0) 
        : 100;

    // C. Dados para Gráfico de Pizza (Status)
    const statusMap: Record<string, number> = {};
    chamados.forEach(c => {
        const status = c.status || 'OUTROS';
        statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // D. Dados para Gráfico de Rosca (SLA)
    const slaData = [
        { name: 'No Prazo', value: totalGeral - slaViolado },
        { name: 'Atrasado', value: slaViolado }
    ];

    // E. Timeline (Volume Diário)
    const diasDoIntervalo = eachDayOfInterval({ start: startDate, end: endDate });
    const timelineData = diasDoIntervalo.map((dia) => {
        const diaFormatado = format(dia, 'yyyy-MM-dd');
        const diaExibicao = format(dia, 'dd/MM');
        const qtd = chamados.filter(c => format(new Date(c.createdAt), 'yyyy-MM-dd') === diaFormatado).length;
        return { name: diaExibicao, chamados: qtd };
    });

    // F. NOVO: Volume por Faixa de Horário (00h às 23h)
    // Inicializamos as 24 horas do dia para o gráfico ficar completo
    const hourCounts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
        const label = `${i.toString().padStart(2, '0')}h`;
        hourCounts[label] = 0;
    }

    chamados.forEach(c => {
        const hora = new Date(c.createdAt).getHours();
        const label = `${hora.toString().padStart(2, '0')}h`;
        hourCounts[label]++;
    });

    const hourlyData = Object.entries(hourCounts).map(([name, value]) => ({
        name,
        chamados: value
    }));

    // G. Top Tags (Assuntos)
    const tagCounts: Record<string, number> = {};
    chamados.forEach(c => {
        c.tags.forEach(tag => {
            tagCounts[tag.nome] = (tagCounts[tag.nome] || 0) + 1;
        });
    });
    const tagsData = Object.entries(tagCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // H. Performance da Equipe
    const teamStats: Record<string, { name: string, resolvidos: number, pendentes: number }> = {};
    chamados.forEach(c => {
        const resp = c.responsavel || 'Não Atribuído';
        if (!teamStats[resp]) teamStats[resp] = { name: resp, resolvidos: 0, pendentes: 0 };

        if (c.status === 'FINALIZADO') {
            teamStats[resp].resolvidos++;
        } else {
            teamStats[resp].pendentes++;
        }
    });
    const teamData = Object.values(teamStats).sort((a, b) => b.resolvidos - a.resolvidos);

    // 4. Retorno Final
    return {
      kpis: { 
          total: totalGeral, 
          finalizados: totalFinalizados, 
          pendentes: totalPendentes,
          slaViolado,
          percentualSlaOk
      },
      statusData,
      timelineData,
      hourlyData, // <-- Agora disponível para o gráfico dinâmico
      slaData,
      tagsData,
      teamData
    };
}
  async remove(id: number) {
    // Apaga tudo em ordem para não dar erro de chave estrangeira
    return this.prisma.$transaction([
      // 1. Apaga anexos soltos (se houver lógica específica)
      this.prisma.anexo.deleteMany({ where: { chamadoId: id } }),
      
      // 2. Apaga interações (mensagens)
      this.prisma.interacao.deleteMany({ where: { chamadoId: id } }),
      
      // 3. Apaga telefones e emails vinculados
      this.prisma.telefone.deleteMany({ where: { chamadoId: id } }),
      this.prisma.email.deleteMany({ where: { chamadoId: id } }),

      // 4. Finalmente, apaga o chamado
      this.prisma.chamado.delete({ where: { id } }),
    ]);
  }

  async getTags() {
    return this.prisma.tag.findMany({ orderBy: { nome: 'asc' } });
  }

  async createTag(nome: string, cor: string) {
    return this.prisma.tag.create({ data: { nome, cor } });
  }

  async updateChamadoTags(chamadoId: number, tagIds: number[]) {
    // Primeiro desconecta todas, depois conecta as novas (substituição)
    return this.prisma.chamado.update({
      where: { id: chamadoId },
      data: {
        tags: {
          set: tagIds.map(id => ({ id })) // O 'set' substitui a lista atual pela nova
        }
      },
      include: { tags: true } // Retorna as tags atualizadas
    });
  }

  async deleteTag(id: number) {
    // O Prisma remove automaticamente a relação com os chamados (Implicit Many-to-Many)
    return this.prisma.tag.delete({ where: { id } });
  }

  async updateTag(id: number, data: { cor: string }) {
    return this.prisma.tag.update({
      where: { id },
      data: { cor: data.cor }
    });
  }

  async updateResponsavel(id: number, responsavel: string, responsavelCor: string) {
  return this.prisma.chamado.update({
    where: { id },
    data: { 
      responsavel, 
      responsavelCor 
    },
  });
}




}
