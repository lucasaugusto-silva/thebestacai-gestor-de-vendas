export type PaymentDto = {
  id: string;
  amount: number;
  type: number;
  flag_card?: number;
  formated_type?: string;
  created_at?: string;
  deleted_at?: string;
};
