import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  senha: string; // ou password, confira como está no seu controller

  // 👇 NOVO CAMPO
  @IsString()
  @IsOptional()
  cor?: string;
}