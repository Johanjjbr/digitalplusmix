import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

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
}

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
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_name?: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

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
  documentNumber?: string;  // En SQL es document_number
  created_at: string;
  updated_at: string;
  
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
}