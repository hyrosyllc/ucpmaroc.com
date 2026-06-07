/**
 * Domain Marketplace Types
 */

export interface Domain {
  id: string;
  name: string;
  category: string;
  price_buy: number;
  price_rent_standard: number;
  price_rent_deal: number;
  fee_web_dev?: number;
  status: 'available' | 'sold' | 'rented';
  created_at: string;
}

export interface DomainOrder {
  id: string;
  domain_id: string;
  user_id?: string;
  buyer_name: string;
  buyer_email: string;
  buyer_cin: string;
  buyer_phone: string;
  selected_option: 'buy' | 'rent_standard_monthly' | 'rent_standard_yearly' | 'rent_deal';
  payment_status: 'awaiting_payment' | 'paid' | 'failed';
  payment_intent_id?: string;
  signature_url?: string;
  stripe_customer_id?: string;
  nameservers?: {
    ns1: string;
    ns2: string;
  };
  created_at: string;
}

export interface PriceData {
  total: number;
  label: string;
  savings?: number;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
}
