export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_id: string;
  client?: Client;
  case_type: string;
  court_instance?: string;
  opposing_party?: string;
  internal_notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  transcription?: string;
  extracted_dates?: string[];
  extracted_numbers?: string[];
  transcription_status: 'pending' | 'completed' | 'failed';
  uploaded_at: string;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'court_hearing' | 'deadline' | 'meeting' | 'other';
  is_completed: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  is_user: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  case_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}