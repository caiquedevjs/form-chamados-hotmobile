/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
// Certifique-se que o caminho da importação está correto para o seu projeto
import { IStorageService } from 'src/Ticket/services/storage.interface';

@Injectable()
export class SupabaseService implements IStorageService {
  private supabase;

  constructor() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase URL ou Key não configuradas.');
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // ✅ CORREÇÃO AQUI: Removida a duplicação de parâmetros
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    bucket: string = 'anexos',
  ): Promise<string> {
    
    // 1. LÓGICA DE LIMPEZA DO NOME
    const nomeLimpo = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase();

    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}-${nomeLimpo}`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/octet-stream',
      });

    if (error) {
      console.error('Erro detalhado Supabase:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
}