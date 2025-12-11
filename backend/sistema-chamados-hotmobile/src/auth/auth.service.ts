import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service'; 
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Login: Valida email e senha
  async login(email: string, pass: string) {
    // 1. Busca usuário
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Compara a senha digitada com o Hash do banco
    const isMatch = await bcrypt.compare(pass, user.senha);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gera o Token
    const payload = { sub: user.id, email: user.email, nome: user.nome };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nome: user.nome, email: user.email }
    };
  }

  // Registro: Cria usuário com senha criptografada
  async register(data: { email: string; senha: string; nome: string }) {
    const hashedPassword = await bcrypt.hash(data.senha, 10);
    
    return this.prisma.usuario.create({
      data: {
        email: data.email,
        nome: data.nome,
        senha: hashedPassword,
      },
    });
  }
}