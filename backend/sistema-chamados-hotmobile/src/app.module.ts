import { Module } from '@nestjs/common';
import { ChamadosModule } from './Ticket/modules/chamados.module';

@Module({
  imports: [ChamadosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
