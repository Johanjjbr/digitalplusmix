import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== INTERFACES ====================

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'technician';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: 'create' | 'update' | 'delete';
  entity_type: 'client' | 'plan' | 'invoice' | 'user' | 'ticket' | 'zone';
  entity_id?: string;
  entity_name?: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  color?: string;
  center_latitude?: number;
  center_longitude?: number;
  created_at: string;
  updated_at: string;
  // Aceptar también camelCase para compatibilidad
  centerLatitude?: number;
  centerLongitude?: number;
}

export type ZoneInput = Partial<Omit<Zone, 'id' | 'created_at' | 'updated_at'>>;

export interface Ticket {
  id: string;
  client_id?: string;
  client_name?: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'complaint' | 'installation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  assigned_to?: string;
  reported_by?: string;
  resolved_at?: string;
  scheduled_visit_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Aceptar también camelCase para compatibilidad con formularios
  clientId?: string;
  clientName?: string;
  assignedTo?: string;
  reportedBy?: string;
  resolvedAt?: string;
  scheduledVisitDate?: string;
}

export type TicketInput = Partial<Omit<Ticket, 'id' | 'created_at' | 'updated_at'>>;

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_name?: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  // Aceptar también camelCase para compatibilidad
  ticketId?: string;
  userId?: string;
  userName?: string;
  isInternal?: boolean;
}

export type TicketCommentInput = Partial<Omit<TicketComment, 'id' | 'created_at'>>;

export interface Payment {
  id: string;
  invoice_id: string;
  client_id?: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
  paid_by?: string;
  payment_date: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ip_address: string;
  pole_number: string;
  neighborhood: string;
  plan_id: string;
  plan_name?: string;
  status: 'active' | 'suspended' | 'delinquent';
  connection_status: 'online' | 'offline';
  monthly_fee?: number;
  join_date: string;
  latitude?: number;
  longitude?: number;
  zone_id?: string;
  last_payment_date?: string;
  next_billing_date?: string;
  document_number?: string;
  credit_balance?: number;
  created_at: string;
  updated_at: string;
  // Aceptar también camelCase
  ipAddress?: string;
  poleNumber?: string;
  planId?: string;
  planName?: string;
  connectionStatus?: string;
  monthlyFee?: number;
  joinDate?: string;
  zoneId?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  documentNumber?: string;
  creditBalance?: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  download_speed: string;
  upload_speed: string;
  expiration_date?: string;
  popular?: boolean;
  created_at: string;
  updated_at: string;
  // Aceptar también camelCase
  downloadSpeed?: string;
  uploadSpeed?: string;
  expirationDate?: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  client_name?: string;
  amount: number;
  amount_paid?: number;
  balance?: number;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  payment_reference?: string;
  paid_by?: string;
  notes?: string;
  is_monthly_auto?: boolean;
  created_at: string;
  updated_at: string;
  // Aceptar también camelCase
  clientId?: string;
  clientName?: string;
  amountPaid?: number;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidBy?: string;
  isMonthlyAuto?: boolean;
}

export type ClientInput = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;
export type PlanInput = Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>;
export type InvoiceInput = Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>;