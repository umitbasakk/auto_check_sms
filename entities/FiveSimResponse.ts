// 1. Tekil SMS yapısı (Değişmedi)
export interface SMS {
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code: string;
}

// 2. Tek bir Siparişin yapısı (Senin eski 'FiveSimStatusEntity' dediğin şey)
// Buna 'FiveSimOrder' adını veriyoruz ki karışmasın.
export interface FiveSimOrder {
  id: number;
  created_at: string;
  phone: string;
  product: string;
  price: number;
  status: string; // İstersen detaylandırabilirsin: 'PENDING' | 'FINISHED' | 'CANCELED' | 'TIMEOUT'
  expires: string;
  sms: SMS[];
  forwarding: boolean;
  forwarding_number: string | null; // null gelebilir
  country: string;
}

// 3. API'den dönen ANA CEVAP (Adapter'ın return ettiği tip)
// Adapter kodunda 'response.Data' diyebilmek için bu yapı şart.
export interface FiveSimStatusEntity {
  Data: FiveSimOrder[]; // Sipariş listesi burada tutulur
}