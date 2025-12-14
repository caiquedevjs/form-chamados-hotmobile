import { Module } from '@nestjs/common';
import { ChamadosModule } from './Ticket/modules/chamados.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // Pega a pasta 'uploads' na raiz do projeto
      serveRoot: '/uploads', // Define que a URL será http://.../uploads/...
    }),

    // eslint-disable-next-line prettier/prettier
    ChamadosModule, AuthModule, SupabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
