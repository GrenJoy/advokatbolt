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
  model: 'gemini-1.5-flash',
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

// API роут для AI чата
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' })
    }

    let prompt = message
    
    if (context) {
      prompt = `Контекст: ${context}\n\nВопрос: ${message}\n\nОтветьте как опытный российский юрист, учитывая российское законодательство.`
    }

    const result = await chatModel.generateContent(prompt)
    const response = await result.response
    const aiResponse = response.text()

    res.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('Ошибка при обращении к AI:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Не удалось получить ответ от AI. Попробуйте позже.' 
    })
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