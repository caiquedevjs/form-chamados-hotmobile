import { IsString, IsNotEmpty, IsArray, IsEmail, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateChamadoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  servico: string;

  @IsString()
  descricao: string;

  // --- Validação da Lista de Emails ---
  // O Transform é necessário porque o FormData envia arrays às vezes como strings separadas
  // ou JSON string. Esse helper garante que vire array.
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray() // Garante que é uma lista
  @IsEmail({}, { each: true }) // Valida cada item da lista se é um email real
  emails: string[];

  // --- Validação da Lista de Telefones ---
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  @IsString({ each: true }) // Garante que cada item é string
  telefones: string[];

  // Nota: Arquivos não são validados no DTO, mas sim no Interceptor do Controller
}