// API endpoints для серверных вызовов
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : ''

export interface OCRResult {
  extractedText: string
  documentType: string
  confidence: number
  summary: string
  keyEntities: string[]
  legalCategory?: string
}

export async function processDocumentOCR(file: File): Promise<OCRResult> {
  try {
    const formData = new FormData()
    formData.append('document', file)

    const response = await fetch(`${API_BASE_URL}/api/ocr`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }))
      throw new Error(errorData.error || 'Ошибка при обработке документа')
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Ошибка при обработке документа')
    }

    return result.data

  } catch (error) {
    console.error('Ошибка при обработке документа:', error)
    throw error instanceof Error ? error : new Error('Не удалось обработать документ')
  }
}

export async function chatWithAI(message: string, context?: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        context
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }))
      throw new Error(errorData.error || 'Ошибка при обращении к AI')
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Ошибка при обращении к AI')
    }

    return result.response

  } catch (error) {
    console.error('Ошибка при обращении к AI:', error)
    throw error instanceof Error ? error : new Error('Не удалось получить ответ от AI')
  }
}

// Функция для проверки доступности API
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    
    if (!response.ok) {
      return false
    }

    const result = await response.json()
    return result.status === 'ok' && result.geminiConfigured

  } catch (error) {
    console.error('Ошибка подключения к API:', error)
    return false
  }
}