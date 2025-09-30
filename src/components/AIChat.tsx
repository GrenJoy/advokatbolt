import React, { useState, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Paperclip, 
  FileText,
  Brain,
  Zap,
  Loader2
} from 'lucide-react'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  context?: string
}

interface AIChatProps {
  title?: string
  subtitle?: string
  placeholder?: string
  suggestedQuestions?: string[]
  sessionId?: string | null
  context?: string
  onSessionIdChange?: (sessionId: string) => void
  className?: string
}

export default function AIChat({ 
  title = "AI Помощник",
  subtitle = "Юридический ИИ-ассистент",
  placeholder = "Задайте вопрос...",
  suggestedQuestions = [],
  sessionId: externalSessionId,
  context,
  onSessionIdChange,
  className = ""
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(externalSessionId || null)
  const [totalTokens, setTotalTokens] = useState(0)

  // Обновляем внутренний sessionId при изменении внешнего
  useEffect(() => {
    if (externalSessionId !== undefined) {
      setSessionId(externalSessionId)
    }
  }, [externalSessionId])

  // Загрузка истории чата при инициализации
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!sessionId) return
      
      try {
        const url = `/api/chat/history?sessionId=${sessionId}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.messages && data.messages.length > 0) {
            const formattedMessages = data.messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              isUser: msg.role === 'user',
              timestamp: new Date(msg.timestamp).toLocaleString('ru-RU'),
              context: msg.role === 'assistant' ? 'Ответ от Gemini Flash' : undefined
            }))
            setMessages(formattedMessages)
          }
          
          setTotalTokens(data.totalTokens || 0)
        }
      } catch (error) {
        console.error('Ошибка загрузки истории:', error)
      }
    }

    loadChatHistory()
  }, [sessionId])

  // Очистка истории чата
  const clearChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: sessionId }),
      })

      if (response.ok) {
        setMessages([])
        setSessionId(null)
        onSessionIdChange?.(null)
        setTotalTokens(0)
      }
    } catch (error) {
      console.error('Ошибка очистки истории:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleString('ru-RU')
    }

    setMessages(prev => [...prev, newMessage])
    const currentMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    try {
      // Реальный запрос к Gemini API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentMessage,
          sessionId: sessionId,
          context: context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка при отправке сообщения')
      }

      const result = await response.json()
      
      // Обновляем sessionId если он изменился
      if (result.sessionId && result.sessionId !== sessionId) {
        setSessionId(result.sessionId)
        onSessionIdChange?.(result.sessionId)
      }
      
      const aiResponse: Message = {
        id: result.message.id,
        content: result.message.content,
        isUser: false,
        timestamp: new Date(result.message.timestamp).toLocaleString('ru-RU'),
        context: `Ответ от Gemini 2.5 Flash • Токенов: ${result.totalTokens}`
      }
      
      setMessages(prev => [...prev, aiResponse])
      setTotalTokens(result.totalTokens)
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

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <div className={`p-6 h-full ${className}`}>
      <div className="h-full">
        {/* Main Chat Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                <p className="text-slate-600">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                  <Brain className="w-4 h-4" />
                  Gemini Flash
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <FileText className="w-4 h-4" />
                  Токенов: {totalTokens}
                </div>
                <button
                  onClick={clearChatHistory}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-sm transition-colors"
                  title="Очистить историю чата"
                >
                  Очистить
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
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
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
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
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-2xl">
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
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && messages.length <= 3 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3">Быстрые команды:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-700 transition-colors text-left"
                  >
                    <Zap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-slate-200">
            <div className="flex gap-3">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={placeholder}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}