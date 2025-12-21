export interface SMS {
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code: string;
}

export interface FiveSimStatusEntity {
  id: number;
  created_at: string;
  phone: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  sms: SMS[];
  forwarding: boolean;
  forwarding_number: string;
  country: string;
}