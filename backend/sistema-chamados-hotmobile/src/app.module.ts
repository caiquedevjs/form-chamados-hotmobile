import { Module } from '@nestjs/common';
import { ChamadosModule } from './Ticket/modules/chamados.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // Pega a pasta 'uploads' na raiz do projeto
      serveRoot: '/uploads', // Define que a URL será http://.../uploads/...
    }),

    ChamadosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
