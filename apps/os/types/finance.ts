export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TransactionCategory {
  id: string;
  code?: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface PaymentMethod {
  id: string;
  code?: string;
  name: string;
  isActive?: boolean;
}

export type EventStatus = 'pending' | 'delivered' | 'collected' | 'cancelled';

export interface BusinessEvent {
  id: string;
  folio?: string;
  name: string;
  eventDate?: string | null;
  eventTime?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  eventAddress?: string | null;
  cost?: number;
  paidAmount?: number;
  needsReturn?: boolean;
  status?: EventStatus;
  guaranteeDocument?: string | null;
  noteId?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Movimiento de dinero tal como lo responde el API. */
export interface Transaction {
  id: string;
  folio: string;
  transactionDate: string;
  type: 'INPUT' | 'OUTPUT';
  amount: number;
  description: string | null;
  category: { id: string; code: string; name: string };
  paymentMethod: { id: string; code: string; name: string };
  businessEvent: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionCategoryDto {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreatePaymentMethodDto {
  code: string;
  name: string;
  isActive?: boolean;
}

/** Nota de venta o cotización tal como la responde el API. */
export interface SalesNote {
  id: string;
  folio: string;
  status: 'quote' | 'note';
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  customerEmail: string | null;
  applyIva: boolean;
  ivaRate: number;
  subtotal: number;
  ivaAmount: number;
  total: number;
  eventId: string | null;
  notes: string | null;
  items: SalesNoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesNoteItem {
  id: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentCard {
  id: string;
  bank: string;
  cardNumber?: string;
  clabe?: string;
  beneficiary: string;
}

export interface GalleryItem {
  id: string;
  url: string;          // URL pública del archivo (el API los sirve en /files)
  label: string | null; // Etiqueta legible, p.ej: "Mesas y sillas"
  alt: string | null;   // Texto alternativo accesible
  order: number;        // Ya viene ordenado ASC desde el backend
}

export interface BusinessValue {
  id: string;
  title: string;            // p.ej: "Responsabilidad"
  description: string | null;
  icon: string | null;      // Nombre de ícono lucide-react, p.ej: "clock"
  order: number;
}

export interface BusinessStat {
  id: string;
  value: string;  // String libre, p.ej: "+500", "8+", "100%"
  label: string;  // p.ej: "eventos atendidos"
  order: number;
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  rating: number; // 1–5 (para renderizar estrellas)
  order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface BusinessConfig {
  id?: string;
  name: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  services: string[];
  coverageAreas: string[];
  termsAndConditions?: string;
  description?: string;
  history?: string;
  mission?: string;
  vision?: string;
  openingHours?: string;
  paymentCards: PaymentCard[];
  whatsappMessage?: string | null;
  gallery?: GalleryItem[];
  values?: BusinessValue[];
  stats?: BusinessStat[];
  testimonials?: Testimonial[];
  faqs?: Faq[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateBusinessConfigDto {
  name?: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  services?: string[];
  coverageAreas?: string[];
  termsAndConditions?: string;
  description?: string;
  history?: string;
  mission?: string;
  vision?: string;
  openingHours?: string;
  whatsappMessage?: string | null;
}

export interface CreatePaymentCardDto {
  bank: string;
  cardNumber?: string;
  clabe?: string;
  beneficiary: string;
}

export interface PublicBusinessResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  config: BusinessConfig;
}
