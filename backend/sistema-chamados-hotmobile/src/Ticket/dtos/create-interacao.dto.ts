import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { TipoAutor } from '@prisma/client';

export class CreateInteracaoDto {
  @IsNotEmpty()
  @IsString()
  texto: string;

  @IsNotEmpty()
  @IsEnum(TipoAutor)
  autor: TipoAutor; // O Front vai mandar se é SUPORTE ou CLIENTE

  @IsOptional()
  @IsBoolean()
  interno?: boolean;
}