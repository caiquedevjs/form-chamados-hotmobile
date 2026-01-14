import { Controller, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password || body.senha);
  }

  // Rota para criar o primeiro usuário (depois você pode remover ou proteger)
  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

 @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  // 👇 3. Use @Req() e tipei como Request
  async updateProfile(@Req() req: express.Request, @Body() body: any) {
    
    // 👇 O TypeScript pode reclamar que 'user' não existe em Request.
    // Se isso acontecer, use: (req as any).user
    const user = (req as any).user;

    const dados = {
        nome: body.nome,
        email: body.email,
        cor: body.cor,
        senha: body.password 
    };

    const userId = user.userId || user.sub || user.id; 

    return this.authService.updateProfile(userId, dados);
  }
}