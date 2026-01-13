import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { TipoAutor } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateInteracaoDto {
  @IsNotEmpty()
  @IsString()
  texto: string;

  @IsNotEmpty()
  @IsEnum(TipoAutor)
  autor: TipoAutor; // O Front vai mandar se é SUPORTE ou CLIENTE
@IsOptional()
  // 👇 A MÁGICA ACONTECE AQUI:
  // Se vier "true" (string do FormData), ele converte para true (boolean)
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  interno?: boolean;
}