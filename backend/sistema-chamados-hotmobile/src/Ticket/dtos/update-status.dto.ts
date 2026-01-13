import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatusChamado } from '@prisma/client'; 

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(StatusChamado, {
    message: 'Status inválido. Valores permitidos: NOVO, EM_ATENDIMENTO, AGUARDANDO_CLIENTE, FINALIZADO',
  })
  status: StatusChamado;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsString()
  @IsOptional()
  responsavelCor?: string;
}