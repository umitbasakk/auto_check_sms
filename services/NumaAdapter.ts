import axios, { type AxiosInstance } from 'axios';
import { FiveSimStatusEntity } from '../entities/FiveSimResponse';
import { SmsManStatusEntity } from '../entities/SmsManStatusEntity';

export class NumaAdapter {
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(baseUrl:string) {
    this.baseUrl = baseUrl;



    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/json',
        'x-api-key': process.env.NUMA_KEY
      },
      timeout:5000
    });
  }

  public async cancelProduct(phone: number,user_id:string): Promise<SmsManStatusEntity> {
    const endpoint = `sms/cancelfromservice`;
    try {
        const response = await this.httpClient.post<SmsManStatusEntity>(endpoint, { phone:phone,user_id:user_id });  
        const result = response.data;
        return result;
    } catch (error) {
      console.log(error);
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
    public async successSmsProductWithSms(sms_code:string,process_id:string): Promise<SmsManStatusEntity> {
      const endpoint = `sms/successSmsProduct`;
      try {
          const response = await this.httpClient.post<any>(endpoint, {sms_code:sms_code,process_id:process_id});  
          const result = response.data;
          return result;
      } catch (error) {
        console.log(error);
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