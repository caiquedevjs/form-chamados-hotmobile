import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChamadosModule } from './Ticket/modules/chamados.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AppController } from './app.controller';
import { RespostasController } from './respostas/respostas.controller';
import { PrismaService } from './prisma.service';


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // Pega a pasta 'uploads' na raiz do projeto
      serveRoot: '/uploads', // Define que a URL será http://.../uploads/...
    }),
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    // eslint-disable-next-line prettier/prettier
    ChamadosModule, AuthModule, SupabaseModule],
  controllers: [AppController, RespostasController],
  providers: [PrismaService],
})
export class AppModule {}
