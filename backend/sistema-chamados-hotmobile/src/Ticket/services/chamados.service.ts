import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service'; 
import { CreateChamadoDto } from '../dtos/create-chamado.dto';
import { CreateInteracaoDto } from '../dtos/create-interacao.dto';
import { StatusChamado } from '@prisma/client';
import { startOfDay, endOfDay, parseISO, eachDayOfInterval, format } from 'date-fns';
import { ChamadosGateway } from './chamados.gateway';
import { MailService } from './mail.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class ChamadosService {
  constructor(private readonly prisma: PrismaService, private readonly gateway: ChamadosGateway, private readonly mailService: MailService, private readonly whatsappService: WhatsappService) {}

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
    // 1. Atualiza o status no banco e busca os contatos atualizados
    const chamadoAtualizado = await this.prisma.chamado.update({
      where: { id },
      data: { status: novoStatus },
      include: { emails: true, telefones: true } 
    });

    // 2. Lógica de Disparo de Notificações
    if (novoStatus === 'EM_ATENDIMENTO') {
      
      const linkFrontend = `http://localhost:5173/acompanhamento/${id}`; // Ajuste a porta se necessário

      // A. Enviar Email para TODOS da lista
      // Usamos Promise.all para enviar todos "ao mesmo tempo" sem travar o processo
      if (chamadoAtualizado.emails && chamadoAtualizado.emails.length > 0) {
        const promessasEmail = chamadoAtualizado.emails.map(email => 
          this.mailService.enviarAvisoInicioAtendimento(
            email.endereco, 
            chamadoAtualizado.nomeEmpresa, 
            linkFrontend
          )
        );
        // Não usamos 'await' aqui para não segurar a resposta da API, o envio acontece em segundo plano
        Promise.all(promessasEmail).catch(err => console.error('Erro no envio em massa de emails', err));
      }

      // B. Enviar WhatsApp para TODOS da lista
      if (chamadoAtualizado.telefones && chamadoAtualizado.telefones.length > 0) {
        const promessasZap = chamadoAtualizado.telefones.map(tel => 
          this.whatsappService.enviarAvisoInicioAtendimento(
            tel.numero, 
            chamadoAtualizado.nomeEmpresa, 
            linkFrontend
          )
        );
        Promise.all(promessasZap).catch(err => console.error('Erro no envio em massa de whats', err));
      }
    }

    return chamadoAtualizado;
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
    const novaInteracao = await this.prisma.interacao.create({
      data: {
        texto: data.texto,
        autor: data.autor,
        chamadoId: chamadoId
      }
    });

    // AQUI ESTÁ A MÁGICA ✨
    // Assim que salvou no banco, avisamos o Websocket
    this.gateway.emitirNovaInteracao(chamadoId, novaInteracao);

    return novaInteracao;
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

 async getDashboardMetrics(startStr?: string, endStr?: string) {
    // 1. Define as datas (Se não vier nada, assume últimos 7 dias)
    const endDate = endStr ? endOfDay(parseISO(endStr)) : endOfDay(new Date());
    const startDate = startStr ? startOfDay(parseISO(startStr)) : startOfDay(new Date(new Date().setDate(new Date().getDate() - 7)));

    // 2. Busca totais (KPIs) baseados no filtro de data
    const totalGeral = await this.prisma.chamado.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const totalFinalizados = await this.prisma.chamado.count({ 
      where: { status: 'FINALIZADO', createdAt: { gte: startDate, lte: endDate } } 
    });

    // 3. Busca Distribuição por Status (Pizza) nesse período
    const porStatus = await this.prisma.chamado.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { status: true },
    });

    // 4. Busca dados para o Gráfico de Linha/Barra (Timeline)
    const chamadosNoPeriodo = await this.prisma.chamado.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    });

    // Lógica para preencher os dias vazios (ex: se não teve chamado na terça, tem que aparecer 0)
    const diasDoIntervalo = eachDayOfInterval({ start: startDate, end: endDate });
    
    const graficoTimeline = diasDoIntervalo.map((dia) => {
      const diaFormatadoISO = format(dia, 'yyyy-MM-dd'); // Chave para comparar
      const diaFormatadoExibicao = format(dia, 'dd/MM'); // Label do gráfico

      // Conta quantos chamados caem neste dia
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
