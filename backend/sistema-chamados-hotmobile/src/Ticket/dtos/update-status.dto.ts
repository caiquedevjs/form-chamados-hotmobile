import { IsOptional, IsString, IsEnum } from 'class-validator';

// 1. Defina os Enums para garantir que o NestJS saiba o que é válido
export enum StatusChamado {
  NOVO = 'NOVO',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  AGUARDANDO_CLIENTE = 'AGUARDANDO_CLIENTE',
  FINALIZADO = 'FINALIZADO',
}

export enum PrioridadeEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export class UpdateStatusDto {
  // 👇 O SEGREDO ESTÁ AQUI: @IsOptional()
  // Se não colocar isso, o NestJS acha que 'status' é obrigatório em todo request
  @IsOptional()
  @IsEnum(StatusChamado, {
    message: 'Status inválido. Valores permitidos: NOVO, EM_ATENDIMENTO, AGUARDANDO_CLIENTE, FINALIZADO'
  })
  status?: StatusChamado;

  @IsOptional()
  @IsString()
  responsavel?: string;

  @IsOptional()
  @IsString()
  responsavelCor?: string;

  @IsOptional()
  @IsEnum(PrioridadeEnum, {
    message: 'Prioridade inválida. Valores permitidos: BAIXA, MEDIA, ALTA, CRITICA'
  })
  prioridade?: PrioridadeEnum;
}