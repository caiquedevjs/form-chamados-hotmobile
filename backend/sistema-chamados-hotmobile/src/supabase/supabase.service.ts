/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase;

  constructor() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    // Use a chave de serviço (Service Role) para ignorar RLS e ter permissão total
    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase URL ou Key não configuradas.');
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    bucket: string = 'anexos',
  ): Promise<string> {
    // 👇 1. LÓGICA DE LIMPEZA DO NOME (Sanitization)
    const nomeLimpo = fileName
      .normalize('NFD') // Separa acentos das letras (ex: 'ç' vira 'c' + cedilha)
      .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
      .replace(/\s+/g, '-') // Troca espaços por traços
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove qualquer coisa que não seja letra, número, ponto ou traço
      .toLowerCase(); // Deixa tudo minúsculo

    // Cria um caminho seguro: timestamp + random + nomeLimpo
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
      console.error('Erro detalhado Supabase:', error); // Log para ajudar no debug
      throw new Error(`Falha no upload: ${error.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
}
