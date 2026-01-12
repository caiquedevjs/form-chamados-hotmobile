// src/prisma.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    
    // 👇 ADICIONE ISSO AQUI PARA DESCOBRIR A VERDADE
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        // Mostra só o começo e o final da URL por segurança
        const maskedUrl = dbUrl.substring(0, 25) + '...' + dbUrl.substring(dbUrl.length - 15);
        this.logger.warn(`🔌 CONECTADO NO BANCO: ${maskedUrl}`);
        
        if (dbUrl.includes('supabase')) {
            this.logger.error('❌ CUIDADO: AINDA ESTOU USANDO SUPABASE!');
        } else if (dbUrl.includes('rlwy') || dbUrl.includes('railway')) {
             this.logger.log('✅ SUCESSO: ESTOU USANDO RAILWAY!');
        }
    }
  }
}