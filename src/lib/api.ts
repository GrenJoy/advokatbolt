import { supabase } from './supabase'
import { Client, Case, CaseDocument, ChatSession, ChatMessage } from '../types'

// API функции для работы с клиентами
export const clientsApi = {
  // Получить всех клиентов
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Создать клиента
  async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Обновить клиента
  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Удалить клиента
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// API функции для работы с делами
export const casesApi = {
  // Получить все дела с клиентами
  async getAll(): Promise<Case[]> {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Получить дело по ID
  async getById(id: string): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Создать дело
  async create(caseData: Omit<Case, 'id' | 'created_at' | 'updated_at' | 'client'>): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .insert([caseData])
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Обновить дело
  async update(id: string, updates: Partial<Case>): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Удалить дело
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// API функции для работы с документами дел
export const documentsApi = {
  // Получить документы дела
  async getByCaseId(caseId: string): Promise<CaseDocument[]> {
    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', caseId)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Загрузить файл в Supabase Storage
  async uploadFile(file: File, caseId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${caseId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('case-documents')
      .upload(fileName, file)
    
    if (error) throw error
    return data.path
  },

  // Создать запись о документе
  async create(document: Omit<CaseDocument, 'id' | 'uploaded_at'>): Promise<CaseDocument> {
    const { data, error } = await supabase
      .from('case_documents')
      .insert([document])
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Обновить OCR результат
  async updateOCR(id: string, transcription: string, extractedDates?: string[], extractedNumbers?: string[]): Promise<CaseDocument> {
    const { data, error } = await supabase
      .from('case_documents')
      .update({
        transcription,
        extracted_dates: extractedDates,
        extracted_numbers: extractedNumbers,
        transcription_status: 'completed'
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Удалить документ
  async delete(id: string, filePath: string): Promise<void> {
    // Удалить файл из storage
    await supabase.storage
      .from('case-documents')
      .remove([filePath])

    // Удалить запись из базы
    const { error } = await supabase
      .from('case_documents')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// API функции для OCR обработки через Gemini
export const ocrApi = {
  async processImage(imageFile: File): Promise<{ transcription: string, extractedDates: string[], extractedNumbers: string[] }> {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Ошибка обработки изображения')
    }

    return await response.json()
  }
}

// API функции для AI чата
export const chatApi = {
  // Получить сессии чата по делу
  async getSessionsByCaseId(caseId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select(`
        *,
        messages:ai_chat_messages(*)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Создать новую сессию чата
  async createSession(caseId: string, title: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .insert([{ case_id: caseId, title }])
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Отправить сообщение в чат
  async sendMessage(sessionId: string, message: string, isUser: boolean, contextData?: any): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert([{ 
        session_id: sessionId, 
        message, 
        is_user: isUser,
        context_data: contextData 
      }])
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Получить ответ от AI
  async getAIResponse(message: string, caseContext: any): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        context: caseContext
      })
    })

    if (!response.ok) {
      throw new Error('Ошибка получения ответа от AI')
    }

    const data = await response.json()
    return data.response
  }
}