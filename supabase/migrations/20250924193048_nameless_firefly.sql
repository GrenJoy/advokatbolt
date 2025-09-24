/*
  # Схема базы данных для адвокатской практики
  
  1. Таблицы
    - `lawyers` - адвокаты/пользователи системы
    - `clients` - клиенты адвоката  
    - `cases` - дела с полной информацией
    - `case_documents` - документы и фотографии с OCR расшифровками
    - `document_comments` - комментарии к документам
    - `case_events` - события и дедлайны
    - `ai_chat_sessions` - сессии чатов с ИИ
    - `ai_chat_messages` - сообщения в чатах
    - `case_history` - история изменений дел
  
  2. Безопасность
    - Включен RLS для всех таблиц
    - Политики доступа на основе аутентификации
    - Связи между таблицами через внешние ключи
*/

-- Адвокаты (пользователи системы)
CREATE TABLE IF NOT EXISTS lawyers (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can read own data"
  ON lawyers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Lawyers can update own data"
  ON lawyers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Клиенты адвоката
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (lawyer_id = auth.uid());

-- Дела
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  case_number text NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  case_type text NOT NULL,
  court_instance text,
  opposing_party text,
  internal_notes text,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage own cases"
  ON cases
  FOR ALL
  TO authenticated
  USING (lawyer_id = auth.uid());

-- Документы дел с OCR обработкой
CREATE TABLE IF NOT EXISTS case_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  transcription text,
  extracted_dates text[],
  extracted_numbers text[],
  transcription_status text DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'completed', 'failed')),
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage documents for own cases"
  ON case_documents
  FOR ALL
  TO authenticated
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid()
    )
  );

-- Комментарии к документам
CREATE TABLE IF NOT EXISTS document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES case_documents(id) ON DELETE CASCADE,
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage comments on own documents"
  ON document_comments
  FOR ALL
  TO authenticated
  USING (lawyer_id = auth.uid());

-- События и дедлайны по делам
CREATE TABLE IF NOT EXISTS case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_type text DEFAULT 'other' CHECK (event_type IN ('court_hearing', 'deadline', 'meeting', 'other')),
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage events for own cases"
  ON case_events
  FOR ALL
  TO authenticated
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid()
    )
  );

-- Сессии чатов с ИИ
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage AI chats for own cases"
  ON ai_chat_sessions
  FOR ALL
  TO authenticated
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid()
    )
  );

-- Сообщения в чатах с ИИ
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_user boolean NOT NULL,
  context_data jsonb,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can manage messages in own AI chats"
  ON ai_chat_messages
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM ai_chat_sessions s
      JOIN cases c ON s.case_id = c.id
      WHERE c.lawyer_id = auth.uid()
    )
  );

-- История изменений дел
CREATE TABLE IF NOT EXISTS case_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can read history of own cases"
  ON case_history
  FOR SELECT
  TO authenticated
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid()
    )
  );

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_clients_lawyer_id ON clients(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_date ON case_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_case_id ON ai_chat_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);

-- Полнотекстовый поиск по документам
CREATE INDEX IF NOT EXISTS idx_case_documents_transcription_fts 
  ON case_documents USING gin(to_tsvector('russian', transcription));

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE OR REPLACE TRIGGER update_lawyers_updated_at 
  BEFORE UPDATE ON lawyers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_cases_updated_at 
  BEFORE UPDATE ON cases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_ai_chat_sessions_updated_at 
  BEFORE UPDATE ON ai_chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();