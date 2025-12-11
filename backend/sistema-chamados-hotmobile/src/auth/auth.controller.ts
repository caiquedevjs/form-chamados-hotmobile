import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

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
}