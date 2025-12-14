import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [SupabaseService],
  exports: [SupabaseService], // Exportamos para poder usar em outros módulos (ChamadosModule)
})
// eslint-disable-next-line prettier/prettier
export class SupabaseModule {}