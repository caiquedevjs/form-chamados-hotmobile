import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatusChamado } from '@prisma/client'; 

export enum PrioridadeEnum {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(StatusChamado, {
    message: 'Status inválido. Valores permitidos: NOVO, EM_ATENDIMENTO, AGUARDANDO_CLIENTE, FINALIZADO',
  })
  status: StatusChamado;
  
  @IsOptional()
  @IsEnum(PrioridadeEnum, { 
    message: 'Prioridade deve ser BAIXA, MEDIA, ALTA ou CRITICA' 
  })
  prioridade?: PrioridadeEnum;


  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsString()
  @IsOptional()
  responsavelCor?: string;
}