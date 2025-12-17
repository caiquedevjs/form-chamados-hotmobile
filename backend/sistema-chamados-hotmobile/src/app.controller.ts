import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  
  // Rota raiz (opcional)
  @Get()
  getHello(): string {
    return 'Servidor Online! 🚀';
  }

  // ✅ Rota específica para o Robô (Health Check)
  @Get('/ping')
  ping(): string {
    return 'pong'; 
  }
}