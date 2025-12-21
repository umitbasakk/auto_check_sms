
export interface SmsProvider {
    name: string;
    id: number;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
    priority: number;
}
