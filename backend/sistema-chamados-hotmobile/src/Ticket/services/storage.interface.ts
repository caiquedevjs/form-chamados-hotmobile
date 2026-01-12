export interface IStorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, bucket?: string): Promise<string>;
}