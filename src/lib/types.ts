export interface SAVTicket {
  id: string;
  user_id: string;
  customer_name: string;
  email: string;
  phone: string;
  product_type: string;
  serial_number: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SAVNote {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
}