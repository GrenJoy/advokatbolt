import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface ContextOptions {
  includeClientInfo: boolean
  includeOCRTexts: boolean
  includeClientCases: boolean
}

interface AIContextCache {
  id: string
  context_type: 'client' | 'case' | 'case_client'
  entity_id: string
  context_hash: string
  context_summary: string
  full_context: any
  token_count: number
  created_at: string
  updated_at: string
  expires_at: string
}

export function useAIContext(clientId: string | undefined) {
  const [contextOptions, setContextOptions] = useState<ContextOptions>({
    includeClientInfo: true,
    includeOCRTexts: false,
    includeClientCases: false
  })
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [contextCache, setContextCache] = useState<AIContextCache | null>(null)

  // Функция для создания хеша контекста
  const createContextHash = (context: any): string => {
    const contextString = JSON.stringify(context)
    return btoa(contextString).substring(0, 32) // Простой хеш для демо
  }

  // Получить информацию о клиенте
  const getClientInfo = async (clientId: string) => {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw error
    return client
  }

  // Получить OCR тексты документов клиента
  const getClientOCRTexts = async (clientId: string) => {
    const { data: documents, error } = await supabase
      .from('case_documents')
      .select('original_name, transcription, ocr_confidence')
      .eq('client_id', clientId)
      .eq('transcription_status', 'completed')
      .not('transcription', 'is', null)

    if (error) throw error
    return documents || []
  }

  // Получить дела клиента
  const getClientCases = async (clientId: string) => {
    const { data: cases, error } = await supabase
      .from('cases')
      .select('id, case_number, title, description, status')
      .eq('client_id', clientId)

    if (error) throw error
    return cases || []
  }

  // Построить полный контекст
  const buildContext = useCallback(async (clientId: string): Promise<any> => {
    const context: any = {
      timestamp: new Date().toISOString(),
      options: contextOptions
    }

    try {
      // Всегда включаем базовую информацию о клиенте
      if (contextOptions.includeClientInfo) {
        const client = await getClientInfo(clientId)
        context.client = {
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          additionalInfo: client.additional_info
        }
      }

      // Включаем OCR тексты если выбрано
      if (contextOptions.includeOCRTexts) {
        const ocrTexts = await getClientOCRTexts(clientId)
        context.documents = ocrTexts.map((doc: any) => ({
          fileName: doc.original_name,
          text: doc.transcription,
          confidence: doc.ocr_confidence
        }))
      }

      // Включаем информацию о делах если выбрано
      if (contextOptions.includeClientCases) {
        const cases = await getClientCases(clientId)
        context.cases = cases
      }

      return context
    } catch (error) {
      console.error('Ошибка построения контекста:', error)
      throw error
    }
  }, [contextOptions])

  // Загрузить или создать кеш контекста
  const loadOrCreateContextCache = useCallback(async () => {
    if (!clientId) return null
    
    setIsLoadingContext(true)
    try {
      // Сначала пытаемся найти существующий кеш
      const { data: existingCache, error: fetchError } = await supabase
        .from('ai_context_cache')
        .select('*')
        .eq('entity_id', clientId)
        .eq('context_type', 'client')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingCache && !fetchError) {
        // Проверяем, соответствует ли кеш текущим опциям
        const cachedOptions = existingCache.full_context?.options
        if (JSON.stringify(cachedOptions) === JSON.stringify(contextOptions)) {
          setContextCache(existingCache)
          return existingCache
        }
      }

      // Создаем новый контекст
      const fullContext = await buildContext(clientId)
      const contextHash = createContextHash(fullContext)
      
      // Создаем краткое описание контекста
      const contextSummary = `Контекст клиента ${fullContext.client?.name || 'Неизвестно'}: ` +
        `${contextOptions.includeClientInfo ? 'информация о клиенте' : ''}` +
        `${contextOptions.includeOCRTexts ? ', OCR документов' : ''}` +
        `${contextOptions.includeClientCases ? ', информация о делах' : ''}`

      // Примерный подсчет токенов (очень упрощенный)
      const tokenCount = Math.ceil(JSON.stringify(fullContext).length / 4)

      // Сохраняем в кеш
      const { data: newCache, error: insertError } = await supabase
        .from('ai_context_cache')
        .insert({
          context_type: 'client',
          entity_id: clientId,
          context_hash: contextHash,
          context_summary: contextSummary,
          full_context: fullContext,
          token_count: tokenCount,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      setContextCache(newCache)
      return newCache
    } catch (error) {
      console.error('Ошибка загрузки/создания кеша контекста:', error)
      throw error
    } finally {
      setIsLoadingContext(false)
    }
  }, [clientId, contextOptions, buildContext])

  // Очистить кеш контекста
  const clearContextCache = useCallback(async () => {
    if (!clientId) return

    try {
      const { error } = await supabase
        .from('ai_context_cache')
        .delete()
        .eq('entity_id', clientId)
        .eq('context_type', 'client')

      if (error) throw error
      
      setContextCache(null)
    } catch (error) {
      console.error('Ошибка очистки кеша контекста:', error)
      throw error
    }
  }, [clientId])

  // Обновить опции контекста
  const updateContextOptions = useCallback((options: Partial<ContextOptions>) => {
    setContextOptions(prev => ({ ...prev, ...options }))
  }, [])

  return {
    contextOptions,
    updateContextOptions,
    contextCache,
    isLoadingContext,
    loadOrCreateContextCache,
    clearContextCache
  }
}