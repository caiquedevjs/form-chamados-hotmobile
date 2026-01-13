import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRespostaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  texto: string;
}