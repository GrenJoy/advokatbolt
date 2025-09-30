-- Тест структуры AI чата для клиентов

-- 1. Проверка таблицы ai_context_cache
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_context_cache'
ORDER BY ordinal_position;

-- 2. Проверка таблицы ai_chat_sessions
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_chat_sessions'
ORDER BY ordinal_position;

-- 3. Проверка таблицы ai_chat_messages
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_chat_messages'
ORDER BY ordinal_position;

-- 4. Тестовые данные для проверки
-- Создаем тестового клиента
INSERT INTO clients (id, lawyer_id, name, email, phone, address, additional_info)
VALUES (
  'test-client-001',
  '00000000-0000-0000-0000-000000000000',
  'Тестовый Клиент AI',
  'test.ai@example.com',
  '+7 999 123-45-67',
  'г. Москва, ул. Тестовая, д. 1',
  'Тестовый клиент для проверки AI чата. Имеет несколько дел и документов.'
)
ON CONFLICT (id) DO UPDATE SET
  additional_info = EXCLUDED.additional_info;

-- 5. Создаем тестовый контекст
INSERT INTO ai_context_cache (
  context_type,
  entity_id,
  context_hash,
  context_summary,
  full_context,
  token_count
)
VALUES (
  'client',
  'test-client-001',
  'test-hash-' || extract(epoch from now())::text,
  'Контекст для клиента "Тестовый Клиент AI", 0 документов с OCR, 0 связанных дел, 0 заметок',
  jsonb_build_object(
    'entityType', 'client',
    'entityId', 'test-client-001',
    'timestamp', now(),
    'options', jsonb_build_object(
      'includeClientInfo', true,
      'includeDocumentOCR', true,
      'includeLinkedCases', true,
      'includeNotes', true
    ),
    'clientInfo', jsonb_build_object(
      'id', 'test-client-001',
      'name', 'Тестовый Клиент AI',
      'email', 'test.ai@example.com',
      'phone', '+7 999 123-45-67',
      'address', 'г. Москва, ул. Тестовая, д. 1',
      'additional_info', 'Тестовый клиент для проверки AI чата.'
    ),
    'documents', jsonb_build_array(),
    'documentCount', 0,
    'linkedCases', jsonb_build_array(),
    'notes', jsonb_build_array()
  ),
  250
)
ON CONFLICT DO NOTHING;

-- 6. Проверяем созданные данные
SELECT 
  'Клиенты' as table_name,
  count(*) as count
FROM clients
WHERE id = 'test-client-001'

UNION ALL

SELECT 
  'Контекст AI' as table_name,
  count(*) as count
FROM ai_context_cache
WHERE entity_id = 'test-client-001';

-- 7. Проверяем работу контекста
SELECT 
  id,
  context_type,
  entity_id,
  context_summary,
  token_count,
  created_at,
  expires_at
FROM ai_context_cache
WHERE entity_id = 'test-client-001'
ORDER BY created_at DESC
LIMIT 1;