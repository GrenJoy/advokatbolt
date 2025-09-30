import { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Brain,
  FileText,
  Trash2,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAIContext } from '../hooks/useAIContext'
import { supabase } from '../lib/supabase'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  context?: string
  tokenCount?: number
}

interface ClientAIChatProps {
  clientId: string
  clientName: string
}

export default function ClientAIChat({ clientId, clientName }: ClientAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    contextOptions,
    updateContextOptions,
    contextCache,
    isLoadingContext,
    loadOrCreateContextCache,
    clearContextCache
  } = useAIContext(clientId)

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Загрузка или создание сессии чата
  useEffect(() => {
    const initSession = async () => {
      try {
        // Проверяем существующие сессии для клиента
        const { data: existingSessions, error: fetchError } = await supabase
          .from('ai_chat_sessions')
          .select('*')
          .eq('case_id', clientId) // Используем case_id для хранения client_id
          .order('created_at', { ascending: false })
          .limit(1)

        if (fetchError) throw fetchError

        if (existingSessions && existingSessions.length > 0) {
          const session = existingSessions[0]
          setSessionId(session.id)

          // Загружаем историю сообщений
          const { data: messages, error: messagesError } = await supabase
            .from('ai_chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('timestamp', { ascending: true })

          if (messagesError) throw messagesError

          const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.message,
            isUser: msg.is_user,
            timestamp: new Date(msg.timestamp).toLocaleString('ru-RU'),
            context: msg.context_data?.summary,
            tokenCount: msg.context_data?.tokenCount
          }))

          setMessages(formattedMessages)
        } else {
          // Создаем новую сессию
          const { data: newSession, error: createError } = await supabase
            .from('ai_chat_sessions')
            .insert({
              case_id: clientId, // Используем case_id для хранения client_id
              title: `Чат с клиентом: ${clientName}`
            })
            .select()
            .single()

          if (createError) throw createError
          setSessionId(newSession.id)
        }
      } catch (err) {
        console.error('Ошибка инициализации сессии:', err)
        setError('Не удалось загрузить чат')
      }
    }

    if (clientId) {
      initSession()
    }
  }, [clientId, clientName])

  // Загрузка контекста при изменении опций
  useEffect(() => {
    if (clientId) {
      loadOrCreateContextCache()
    }
  }, [clientId, contextOptions, loadOrCreateContextCache])

  // Отправка сообщения
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleString('ru-RU')
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Сохраняем сообщение пользователя
      await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          message: inputMessage,
          is_user: true,
          context_data: {
            options: contextOptions
          }
        })

      // Подготавливаем контекст для AI
      const context = contextCache?.full_context || {}
      
      // Формируем промпт с контекстом
      let systemPrompt = `Ты - юридический AI-ассистент, помогающий работать с информацией о клиенте "${clientName}".`
      
      if (contextOptions.includeClientInfo && context.client) {
        systemPrompt += `\n\nИнформация о клиенте:\n`
        systemPrompt += `- Имя: ${context.client.name}\n`
        systemPrompt += `- Email: ${context.client.email}\n`
        systemPrompt += `- Телефон: ${context.client.phone}\n`
        if (context.client.address) systemPrompt += `- Адрес: ${context.client.address}\n`
        if (context.client.additionalInfo) systemPrompt += `- Дополнительная информация: ${context.client.additionalInfo}\n`
      }

      if (contextOptions.includeOCRTexts && context.documents && context.documents.length > 0) {
        systemPrompt += `\n\nДокументы клиента (OCR):\n`
        context.documents.forEach((doc: any, index: number) => {
          systemPrompt += `\n${index + 1}. ${doc.fileName} (точность OCR: ${(doc.confidence * 100).toFixed(1)}%):\n${doc.text}\n`
        })
      }

      if (contextOptions.includeClientCases && context.cases && context.cases.length > 0) {
        systemPrompt += `\n\nДела клиента:\n`
        context.cases.forEach((case_: any, index: number) => {
          systemPrompt += `\n${index + 1}. ${case_.title} (${case_.case_number})\n`
          systemPrompt += `   Статус: ${case_.status}\n`
          if (case_.description) systemPrompt += `   Описание: ${case_.description}\n`
        })
      }

      // Отправляем запрос к AI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          systemPrompt: systemPrompt,
          sessionId: sessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при получении ответа от AI')
      }

      const result = await response.json()

      // Сохраняем ответ AI
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('ai_chat_messages')
        .insert({
          session_id: sessionId,
          message: result.message.content,
          is_user: false,
          context_data: {
            summary: contextCache?.context_summary,
            tokenCount: result.totalTokens,
            options: contextOptions
          }
        })
        .select()
        .single()

      if (aiMessageError) throw aiMessageError

      const aiMessage: Message = {
        id: aiMessageData.id,
        content: result.message.content,
        isUser: false,
        timestamp: new Date().toLocaleString('ru-RU'),
        context: contextCache?.context_summary,
        tokenCount: result.totalTokens
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err)
      setError('Не удалось отправить сообщение')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.',
        isUser: false,
        timestamp: new Date().toLocaleString('ru-RU')
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Полная очистка чата и кеша
  const handleFullClear = async () => {
    if (!window.confirm('Вы уверены? Это удалит всю историю чата и кеш контекста.')) {
      return
    }

    try {
      // Удаляем сообщения
      if (sessionId) {
        await supabase
          .from('ai_chat_messages')
          .delete()
          .eq('session_id', sessionId)
      }

      // Очищаем кеш контекста
      await clearContextCache()

      // Очищаем локальное состояние
      setMessages([])
      setError(null)
    } catch (err) {
      console.error('Ошибка очистки:', err)
      setError('Не удалось выполнить полную очистку')
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">AI Ассистент</h3>
              <p className="text-sm text-slate-600">Чат с контекстом клиента</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contextCache && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                <Brain className="w-4 h-4" />
                <span>{contextCache.token_count} токенов</span>
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Настройки контекста"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleFullClear}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Полная очистка"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Контекст для AI:</h4>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeClientInfo}
                onChange={(e) => updateContextOptions({ includeClientInfo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Информация о клиенте (имя, контакты, заметки)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeOCRTexts}
                onChange={(e) => updateContextOptions({ includeOCRTexts: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">OCR тексты из документов клиента</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeClientCases}
                onChange={(e) => updateContextOptions({ includeClientCases: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Информация о делах клиента</span>
            </label>

            {isLoadingContext && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Обновление контекста...</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Начните диалог с AI ассистентом</p>
            <p className="text-sm text-slate-400 mt-1">
              Контекст клиента будет автоматически добавлен к вашим вопросам
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[70%] ${message.isUser ? 'order-first' : ''}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>{message.timestamp}</span>
                {message.context && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {message.context}
                    </span>
                  </>
                )}
                {message.tokenCount && (
                  <>
                    <span>•</span>
                    <span>{message.tokenCount} токенов</span>
                  </>
                )}
              </div>
            </div>

            {message.isUser && (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[70%]">
              <div className="px-4 py-3 rounded-2xl bg-slate-100">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Задайте вопрос о клиенте..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </div>
      </div>
    </div>
  )
}