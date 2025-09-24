import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
const port = process.env.PORT || 3001

// Настройка CORS для разработки
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000']
}))

app.use(express.json())

// Настройка multer для обработки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Разрешить только изображения и PDF
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Неподдерживаемый тип файла'), false)
    }
  }
})

// Инициализация Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const ocrModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.1,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  }
})

const chatModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  }
})

// Конвертация файла в base64
function fileToBase64(buffer) {
  return buffer.toString('base64')
}

// API роут для OCR обработки
app.post('/api/ocr', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' })
    }

    // Конвертируем файл в base64
    const base64Data = fileToBase64(req.file.buffer)
    
    const prompt = `
Пожалуйста, проанализируйте этот документ и извлеките текст. Верните результат в формате JSON:

{
  "extractedText": "полный извлеченный текст документа",
  "documentType": "тип документа (договор, решение суда, иск, справка и т.д.)",
  "confidence": оценка качества распознавания от 0 до 1,
  "summary": "краткое резюме содержания документа (2-3 предложения)",
  "keyEntities": ["ключевые лица, организации, даты, суммы"],
  "legalCategory": "категория правовой области (гражданское, уголовное, трудовое, административное)"
}

Если это юридический документ, обратите особое внимание на:
- Номера дел и инстанции
- Даты и сроки
- Стороны процесса
- Суммы и штрафы
- Правовые основания
`

    const result = await ocrModel.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: req.file.mimetype
        }
      }
    ])

    const response = await result.response
    const text = response.text()
    
    // Пытаемся распарсить JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const ocrResult = JSON.parse(jsonMatch[0])
        res.json({
          success: true,
          data: {
            extractedText: ocrResult.extractedText || '',
            documentType: ocrResult.documentType || 'Неизвестный документ',
            confidence: ocrResult.confidence || 0.8,
            summary: ocrResult.summary || 'Не удалось создать резюме',
            keyEntities: ocrResult.keyEntities || [],
            legalCategory: ocrResult.legalCategory || undefined
          }
        })
        return
      }
    } catch (parseError) {
      console.warn('Не удалось распарсить JSON ответ от Gemini:', parseError)
    }

    // Если не удалось распарсить JSON, возвращаем базовый результат
    res.json({
      success: true,
      data: {
        extractedText: text,
        documentType: 'Документ',
        confidence: 0.7,
        summary: 'Текст извлечен, но не удалось провести детальный анализ',
        keyEntities: [],
        legalCategory: undefined
      }
    })

  } catch (error) {
    console.error('Ошибка при обработке документа:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Не удалось обработать документ. Проверьте формат файла и повторите попытку.' 
    })
  }
})

// Хранилище истории чатов по сессиям (в памяти)
const chatSessions = new Map() // sessionId -> { messages: [], lastActivity: Date }
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 часа
const MAX_MESSAGES_PER_SESSION = 100 // Лимит сообщений на сессию

// Генерация ID сессии
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Очистка старых сессий
function cleanupOldSessions() {
  const now = Date.now()
  for (const [sessionId, session] of chatSessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      chatSessions.delete(sessionId)
    }
  }
}

// Получение или создание сессии
function getOrCreateSession(sessionId) {
  if (!sessionId || !chatSessions.has(sessionId)) {
    const newSessionId = generateSessionId()
    chatSessions.set(newSessionId, {
      messages: [],
      lastActivity: Date.now()
    })
    return newSessionId
  }
  
  const session = chatSessions.get(sessionId)
  session.lastActivity = Date.now()
  return sessionId
}

// API роут для AI чата с историей по сессиям
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    // Очистка старых сессий
    cleanupOldSessions()

    // Получаем или создаем сессию
    const currentSessionId = getOrCreateSession(sessionId)
    const session = chatSessions.get(currentSessionId)

    // Проверяем лимит сообщений
    if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
      return res.status(429).json({ 
        error: 'Достигнут лимит сообщений для этой сессии. Начните новый чат.' 
      })
    }

    // Добавляем пользовательское сообщение
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    }
    session.messages.push(userMessage)

    // Подготавливаем контекст для Gemini (последние 10 сообщений)
    const recentMessages = session.messages.slice(-10)
    
    const prompt = `Ты - AI помощник для российского юриста. Отвечай кратко, профессионально и по делу на русском языке.
    
История разговора:
${recentMessages.map(msg => `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.content}`).join('\n')}

Последний вопрос: ${message}

Ответь максимально полезно с учетом российского законодательства. Если нужна дополнительная информация, попроси её.`

    const result = await chatModel.generateContent(prompt)
    const response = await result.response
    const assistantMessage = response.text()

    // Добавляем ответ ассистента
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString()
    }
    session.messages.push(aiMessage)

    res.json({
      message: aiMessage,
      sessionId: currentSessionId,
      totalTokens: session.messages.length * 50 // Примерная оценка токенов
    })

  } catch (error) {
    console.error('Ошибка в чате:', error)
    res.status(500).json({ 
      error: 'Ошибка при обработке запроса к AI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// API для получения истории чата по сессии
app.get('/api/chat/history', (req, res) => {
  try {
    const { sessionId } = req.query

    cleanupOldSessions()

    if (!sessionId || !chatSessions.has(sessionId)) {
      return res.json({
        messages: [],
        sessionId: null,
        totalTokens: 0
      })
    }

    const session = chatSessions.get(sessionId)
    session.lastActivity = Date.now()

    res.json({
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      sessionId: sessionId,
      totalTokens: session.messages.length * 50
    })
  } catch (error) {
    console.error('Ошибка получения истории:', error)
    res.status(500).json({ error: 'Ошибка получения истории чата' })
  }
})

// API для очистки истории чата по сессии
app.delete('/api/chat/clear', (req, res) => {
  try {
    const { sessionId } = req.body

    if (sessionId && chatSessions.has(sessionId)) {
      chatSessions.delete(sessionId)
    }

    res.json({ success: true, message: 'История чата очищена' })
  } catch (error) {
    console.error('Ошибка очистки истории:', error)
    res.status(500).json({ error: 'Ошибка очистки истории чата' })
  }
})

// Проверка состояния API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  })
})

// Обработка ошибок multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер: 10MB' })
    }
  }
  
  if (error.message === 'Неподдерживаемый тип файла') {
    return res.status(400).json({ error: 'Неподдерживаемый тип файла. Поддерживаются: изображения и PDF' })
  }

  console.error('Ошибка сервера:', error)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

app.listen(port, () => {
  console.log(`🚀 OCR API сервер запущен на порту ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/api/health`)
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  ВНИМАНИЕ: GEMINI_API_KEY не установлен!')
  }
})