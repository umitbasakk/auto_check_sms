import axios, { type AxiosInstance } from 'axios';
import { OnlineSimStatusEntity } from '../entities/OnlineSimStatusEntity';



export class OnlineSimAdapter {
    private readonly httpClient: AxiosInstance;
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly devId: string;

    constructor(apiKey: string, baseUrl: string,devId: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.devId = devId;

        if (!this.apiKey) {
            throw new Error('API Key parametresi boş olamaz.');
        }

        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            params: {
                apikey: this.apiKey, 
            },
            headers: {
                'Accept': 'application/json',
            },
            timeout:5000
        });
    }

    public async getSms(id: number): Promise<OnlineSimStatusEntity> {
        const endpoint = `getState.php?apikey=${this.apiKey}&tzid=${id}message_to_code=1&orderby=asc&msg_list=0&clean=1&lang=ru'`;

        try {
            const response = await this.httpClient.get<OnlineSimStatusEntity>(endpoint);
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