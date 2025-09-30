import React, { useMemo, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useAIContext } from '../hooks/useAIContext'
import { generalChatApi } from '../lib/api'

interface Props {
  clientId: string
}

interface UIMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: string
}

export default function ClientAIChat({ clientId }: Props) {
  const { isBuilding, buildContext, saveContextCache, clearContextCache } = useAIContext()
  const [systemPrompt, setSystemPrompt] = useState('Ты - AI помощник юриста. Отвечай кратко и по делу.')
  const [includeClientInfo, setIncludeClientInfo] = useState(true)
  const [includeOCR, setIncludeOCR] = useState(false)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const contextOptions = useMemo(() => ({
    clientId,
    systemPrompt,
    includeClientInfo,
    includeOCR
  }), [clientId, systemPrompt, includeClientInfo, includeOCR])

  const handleSend = async () => {
    if (!input.trim()) return
    setIsSending(true)
    try {
      const built = await buildContext(contextOptions)
      await saveContextCache(clientId, built.contextText)

      // локально добавим сообщение пользователя
      const uiMsg: UIMessage = {
        id: Date.now().toString(),
        content: input.trim(),
        isUser: true,
        timestamp: new Date().toLocaleString('ru-RU')
      }
      setMessages((prev: UIMessage[]) => [...prev, uiMsg])

      // запрос к серверу, передаем context
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), sessionId, context: built.contextText })
      })

      if (!resp.ok) {
        throw new Error('Ошибка чата')
      }

      const json = await resp.json()
      if (json.sessionId && json.sessionId !== sessionId) {
        setSessionId(json.sessionId)
      }
      const aiMsg: UIMessage = {
        id: json.message.id,
        content: json.message.content,
        isUser: false,
        timestamp: new Date(json.message.timestamp).toLocaleString('ru-RU')
      }
      setMessages((prev: UIMessage[]) => [...prev, aiMsg])
      // сохраняем в Supabase в general_ai_chats
      const sid = json.sessionId || sessionId || `client_${clientId}`
      await generalChatApi.appendMessage(sid, uiMsg.content, aiMsg.content)
      setInput('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSending(false)
    }
  }

  const handleFullClear = async () => {
    try {
      // очистка кэша контекста для клиента
      await clearContextCache(clientId)
      // очистка сессионной истории чата в памяти API
      await fetch('/api/chat/clear', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      if (sessionId) {
        await generalChatApi.clear(sessionId)
      }
      setMessages([])
      setSessionId(null)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Контекст: {includeClientInfo ? 'Клиент ' : ''}{includeOCR ? '+ OCR' : ''} {isBuilding ? '(сбор контекста...)' : ''}
        </div>
        <button onClick={handleFullClear} className="text-red-600 hover:text-red-700 text-sm inline-flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Полная очистка
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={includeClientInfo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeClientInfo(e.target.checked)} />
          Включить данные клиента
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={includeOCR} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeOCR(e.target.checked)} />
          Включить OCR
        </label>
        <input
          className="flex-1 px-2 py-1 border border-slate-300 rounded"
          placeholder="Системный промпт"
          value={systemPrompt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSystemPrompt(e.target.value)}
        />
      </div>

      <div className="border rounded-lg p-3 h-72 overflow-y-auto bg-white">
        {messages.map(m => (
          <div key={m.id} className={m.isUser ? 'text-right mb-2' : 'text-left mb-2'}>
            <div className={m.isUser ? 'inline-block bg-blue-600 text-white px-3 py-2 rounded-lg' : 'inline-block bg-slate-100 text-slate-900 px-3 py-2 rounded-lg'}>
              {m.content}
            </div>
            <div className="text-xs text-slate-500 mt-1">{m.timestamp}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Напишите сообщение..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
        />
        <button onClick={handleSend} disabled={isSending || !input.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2">
          <Send className="w-4 h-4" /> Отправить
        </button>
      </div>
    </div>
  )
}

