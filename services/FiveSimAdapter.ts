import axios, { type AxiosInstance } from 'axios';
import { FiveSimStatusEntity } from '../entities/FiveSimResponse';

// Bu interface'ler kullanılmıyorsa silebilirsin, adapter ile ilgisi yok gibi duruyor.
interface ItemDetails {
    Category: string;
    Qty: number;
    Price: number;
}
interface IncomingData {
    [key: string]: ItemDetails;
}

export class FiveSimAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    if (!this.apiKey) {
      throw new Error('FIVESIM_API_KEY environment variable is not set.');
    }

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      timeout: 10000 // Timeout'u biraz artırdım, liste çekerken bazen uzun sürebilir
    });
  }

  public async getLastOrders(limit: number = 100): Promise<FiveSimStatusEntity> {
    try {
        // user/orders endpoint'ine istek atıyoruz
        // params objesi otomatik olarak url sonuna ?category=activation&limit=50 ekler
        const response = await this.httpClient.get<FiveSimStatusEntity>('user/orders', {
            params: {
                category: 'activation',
                limit: limit
            }
        });
        
        return response.data;

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {        
        if (error.response.status === 400) {
            throw new Error(`FiveSim API Hata Kodu: ${JSON.stringify(error.response.data) || 'Geçersiz İstek'}`);
        }
        throw new Error(`5sim API'ye bağlanırken hata oluştu: ${error.response.status} - ${error.response.statusText}`);
      } else {
        throw new Error(`Harici SMS aktivasyon servisine ulaşılamıyor: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }
    }
  }
}