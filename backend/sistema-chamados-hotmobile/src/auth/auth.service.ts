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

    // 2. Compara a senha
    const isMatch = await bcrypt.compare(pass, user.senha);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gera o Token
    const payload = { sub: user.id, email: user.email, nome: user.nome };
    
    return {
      access_token: this.jwtService.sign(payload),
      // 👇 AQUI ESTAVA O ERRO: Faltava enviar a 'cor' de volta pro frontend
      user: { 
          id: user.id, 
          nome: user.nome, 
          email: user.email, 
          cor: user.cor // ✅ Agora o frontend vai receber a cor certa!
      }
    };
  }

  // Registro (Mantido igual, já está correto)
  async register(data: { email: string; senha: string; nome: string; cor: string }) {
    const hashedPassword = await bcrypt.hash(data.senha, 10);
    
    return this.prisma.usuario.create({
      data: {
        email: data.email,
        nome: data.nome,
        cor: data.cor || '#1976d2', // Garante um fallback se vier vazio
        senha: hashedPassword,
      },
    });
  }
}