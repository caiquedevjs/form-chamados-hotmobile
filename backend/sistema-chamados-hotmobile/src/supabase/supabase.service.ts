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
    // ⚠️ ATENÇÃO: Essas variáveis PRECISAM estar no seu .env local e no Render!
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase URL ou Key não configuradas no ambiente.');
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Faz upload de um Buffer (arquivo) para o Supabase Storage
   * @param fileBuffer Buffer do arquivo
   * @param fileName Nome do arquivo
   * @param bucket Nome do bucket (ex: 'anexos')
   * @returns URL pública do arquivo
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    bucket: string = 'anexos',
  ): Promise<string> {
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}-${fileName}`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600', // Cache por 1 hora
        upsert: false,
        contentType: 'application/octet-stream', // Deixa o Supabase detectar o tipo real
      });

    if (error) {
      console.error('Erro ao fazer upload para o Supabase:', error);
      throw new Error('Falha no upload do arquivo.');
    }

    // Pega a URL pública
    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
}
