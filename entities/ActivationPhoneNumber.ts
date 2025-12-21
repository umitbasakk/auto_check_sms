import { SmsProvider } from "./SmsProvider";

export interface ActivationPhoneNumber {
  id: string;
  process_id: number;
  user_id:string;
  phone: string;
  operator:string;
  provider: SmsProvider;
  product: string;
  country: string;
  status: string;
  sms: string;
  created_at: string;
  expires: string;
}