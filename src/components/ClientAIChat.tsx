import React, { useState, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Trash2,
  Settings,
  FileText,
  Brain,
  Check,
  X,
  Loader2,
  AlertCircle,
  Database
} from 'lucide-react'
import { useAIContext } from '../hooks/useAIContext'
import { Client } from '../types'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  context?: string
}

interface ClientAIChatProps {
  client: Client
}

export function ClientAIChat({ client }: ClientAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const {
    contextCache,
    cacheLoading,
    contextOptions,
    setContextOptions,
    generateContext,
    clearCache,
    clearAllCache,
    isGenerating,
    isClearing
  } = useAIContext('client', client.id)

  // Загрузка истории чата при монтировании
  useEffect(() => {
    loadChatHistory()
  }, [client.id])

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/client/${client.id}/history`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.timestamp).toLocaleString('ru-RU'),
            context: msg.role === 'assistant' ? 'С контекстом клиента' : undefined
          }))
          setMessages(formattedMessages)
        }
        if (data.sessionId) {
          setSessionId(data.sessionId)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    // Если нет кеша контекста, генерируем его
    if (!contextCache) {
      await generateContext()
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleString('ru-RU')
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage.trim(),
          clientId: client.id,
          sessionId: sessionId,
          contextCacheId: contextCache?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при отправке сообщения')
      }

      const result = await response.json()
      
      if (result.sessionId && result.sessionId !== sessionId) {
        setSessionId(result.sessionId)
      }
      
      const aiResponse: Message = {
        id: result.message.id,
        content: result.message.content,
        isUser: false,
        timestamp: new Date(result.message.timestamp).toLocaleString('ru-RU'),
        context: `С контекстом клиента • Токенов: ${result.totalTokens}`
      }
      
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Ошибка чата:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Извините, произошла ошибка при обращении к AI. Попробуйте еще раз.',
        isUser: false,
        timestamp: new Date().toLocaleString('ru-RU'),
        context: 'Ошибка системы'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = async () => {
    if (window.confirm('Вы уверены, что хотите очистить историю чата?')) {
      try {
        await fetch(`/api/chat/client/${client.id}/clear`, {
          method: 'DELETE'
        })
        setMessages([])
        setSessionId(null)
      } catch (error) {
        console.error('Ошибка очистки чата:', error)
      }
    }
  }

  const handleRegenerateContext = async () => {
    await generateContext()
  }

  const handleClearAllCache = async () => {
    if (window.confirm('Вы уверены, что хотите очистить весь кеш AI? Это удалит кеш для всех клиентов и дел.')) {
      await clearAllCache()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Ассистент</h3>
            <p className="text-sm text-slate-600">Чат с контекстом клиента {client.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {contextCache && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                <Database className="w-4 h-4" />
                Кеш активен
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Настройки контекста"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              title="Очистить чат"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
            <h4 className="font-medium text-slate-900 mb-2">Настройки контекста</h4>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeClientInfo}
                onChange={(e) => setContextOptions({
                  ...contextOptions,
                  includeClientInfo: e.target.checked
                })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Включить информацию о клиенте (имя, email, доп. информация)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeDocumentOCR}
                onChange={(e) => setContextOptions({
                  ...contextOptions,
                  includeDocumentOCR: e.target.checked
                })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Включить OCR текст из документов</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeLinkedCases}
                onChange={(e) => setContextOptions({
                  ...contextOptions,
                  includeLinkedCases: e.target.checked
                })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Включить информацию о связанных делах</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contextOptions.includeNotes}
                onChange={(e) => setContextOptions({
                  ...contextOptions,
                  includeNotes: e.target.checked
                })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Включить заметки, связанные с клиентом</span>
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleRegenerateContext}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Сгенерировать контекст
                  </>
                )}
              </button>
              
              <button
                onClick={handleClearAllCache}
                disabled={isClearing}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 disabled:bg-slate-300 text-red-700 rounded-lg text-sm transition-colors"
              >
                Полная очистка кеша
              </button>
            </div>

            {contextCache && (
              <div className="mt-3 p-3 bg-white rounded border border-slate-200 text-sm">
                <p className="text-slate-600">
                  <span className="font-medium">Текущий кеш:</span> {contextCache.context_summary}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Создан: {new Date(contextCache.created_at).toLocaleString('ru-RU')} • 
                  Токенов: {contextCache.token_count}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && !cacheLoading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              Начните диалог с AI ассистентом. 
              {!contextCache && ' Контекст будет сгенерирован автоматически при первом сообщении.'}
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
            
            <div className={`max-w-2xl ${message.isUser ? 'order-first' : ''}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-200'
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
            <div className="max-w-2xl">
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Задайте вопрос о клиенте..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}