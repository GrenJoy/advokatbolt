import React, { useState } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Paperclip, 
  Search,
  Clock,
  MessageCircle,
  FileText,
  Brain,
  Zap
} from 'lucide-react'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
  context?: string
}

const mockChats = [
  {
    id: '1',
    caseTitle: 'Трудовой спор ООО "Альфа"',
    caseNumber: 'A40-123456/2024',
    lastMessage: 'Какие документы нужны для подачи иска?',
    timestamp: '2024-12-08 14:30',
    messageCount: 5
  },
  {
    id: '2',
    caseTitle: 'Раздел имущества при разводе',
    caseNumber: 'С-456789/2024',
    lastMessage: 'Проанализируй перспективы дела',
    timestamp: '2024-12-07 16:45',
    messageCount: 8
  },
  {
    id: '3',
    caseTitle: 'Взыскание долга по договору',
    caseNumber: 'Г-789012/2024',
    lastMessage: 'Найди дату истечения срока исковой давности',
    timestamp: '2024-12-05 11:20',
    messageCount: 3
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Привет! Я ваш ИИ-ассистент для работы с делом "Трудовой спор ООО Альфа". У меня есть доступ ко всем документам дела. Чем могу помочь?',
    isUser: false,
    timestamp: '2024-12-08 10:00',
  },
  {
    id: '2',
    content: 'Какие документы нужны для подачи иска о восстановлении на работе?',
    isUser: true,
    timestamp: '2024-12-08 10:01',
  },
  {
    id: '3',
    content: 'На основе анализа вашего дела и документов в системе, для подачи иска о восстановлении на работе потребуются:\n\n**📄 ОБЯЗАТЕЛЬНЫЕ ДОКУМЕНТЫ:**\n• Трудовой договор\n• Приказ об увольнении (найден в документе "prikaz_ob_uvolnenii.pdf")\n• Справка о заработной плате за последние 12 месяцев\n• Документы, подтверждающие незаконность увольнения\n\n**⚖️ ПРАВОВОЕ ОБОСНОВАНИЕ:**\nСогласно ст. 394 ТК РФ, работник вправе обратиться в суд за разрешением индивидуального трудового спора в течение одного месяца.\n\n**⚠️ СРОЧНО:**\nВ вашем деле срок подачи иска истекает 15 января 2025 года!',
    isUser: false,
    timestamp: '2024-12-08 10:02',
    context: 'Проанализированы документы дела A40-123456/2024'
  }
]

const suggestedQuestions = [
  'Найди дату судебного заседания в документах',
  'Анализ перспектив дела',
  'Какие сроки нужно соблюдать?',
  'Что делать дальше по делу?',
  'Найди сумму иска в документах',
  'Проверь процессуальные нарушения'
]

export default function AIChat() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0])
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleString('ru-RU')
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Анализирую ваш запрос и документы дела... Это демо-версия ИИ ассистента. В реальной версии здесь будет ответ от Gemini Pro 2.5 на основе всех документов дела.',
        isUser: false,
        timestamp: new Date().toLocaleString('ru-RU'),
        context: `Проанализированы документы дела ${selectedChat.caseNumber}`
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 2000)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <div className="p-6 h-full">
      <div className="flex h-full gap-6">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">ИИ Чаты по делам</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск чатов..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {mockChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${
                  selectedChat.id === chat.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{chat.caseTitle}</h3>
                    <p className="text-xs text-slate-500 mb-1">{chat.caseNumber}</p>
                    <p className="text-sm text-slate-600 truncate">{chat.lastMessage}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {chat.timestamp}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageCircle className="w-3 h-3" />
                        {chat.messageCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{selectedChat.caseTitle}</h1>
                <p className="text-slate-600">{selectedChat.caseNumber} • ИИ-ассистент с полным контекстом дела</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                  <Brain className="w-4 h-4" />
                  Gemini Pro 2.5
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <FileText className="w-4 h-4" />
                  12 документов
                </div>
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
          {messages.length <= 3 && (
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
                  placeholder="Задайте вопрос по делу... (например: 'найди дату суда в документах')"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
      </div>
    </div>
  )
}