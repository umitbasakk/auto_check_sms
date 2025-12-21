import axios, { type AxiosInstance } from 'axios';
import { FiveSimStatusEntity } from '../entities/FiveSimResponse';
import { SmsManStatusEntity } from '../entities/SmsManStatusEntity';

export class SmsManAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey:string,baseUrl:string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    if (!this.apiKey) {
      throw new Error('FIVESIM_API_KEY environment variable is not set.');
    }

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/json',
      },
      timeout:5000
    });
  }

  public async getSms(id: number): Promise<SmsManStatusEntity> {
    const endpoint = `get-sms?token=${this.apiKey}&request_id=${id}`;

    try {
        const response = await this.httpClient.get<SmsManStatusEntity>(endpoint);
        const result = response.data;
        return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {        
        if (error.response.status === 400) {
            throw new Error(`FiveSim API Hata Kodu: ${error.response.data.error || 'Geçersiz İstek'}`);
        }
        throw new Error(`5sim API'ye bağlanırken hata oluştu: ${error.response.statusText}`);
      } else {
        throw new Error('Harici SMS aktivasyon servisine ulaşılamıyor.');
      }
    }
  }
}