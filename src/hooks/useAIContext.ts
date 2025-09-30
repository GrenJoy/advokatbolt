import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Client } from '../types'

export interface AIContextData {
  clientInfo?: Client
  clientDocuments?: any[]
  caseDocuments?: any[]
  includeClientInfo: boolean
  includeClientDocuments: boolean
  includeCaseDocuments: boolean
}

export interface AIContextCache {
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
  context_key: string
}

export function useAIContext() {
  const [contextData, setContextData] = useState<AIContextData>({
    includeClientInfo: false,
    includeClientDocuments: false,
    includeCaseDocuments: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useState<AIContextCache | null>(null)

  // Генерация хеша для контекста
  const generateContextHash = useCallback((data: AIContextData) => {
    const contextString = JSON.stringify({
      clientId: data.clientInfo?.id,
      includeClientInfo: data.includeClientInfo,
      includeClientDocuments: data.includeClientDocuments,
      includeCaseDocuments: data.includeCaseDocuments,
      clientDocumentsCount: data.clientDocuments?.length || 0,
      caseDocumentsCount: data.caseDocuments?.length || 0
    })
    
    // Простой хеш функция
    let hash = 0
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }, [])

  // Построение контекста для AI
  const buildContext = useCallback((data: AIContextData): string => {
    let context = 'Контекст клиента для AI помощника:\n\n'
    
    if (data.includeClientInfo && data.clientInfo) {
      context += `=== ИНФОРМАЦИЯ О КЛИЕНТЕ ===\n`
      context += `Имя: ${data.clientInfo.name}\n`
      if (data.clientInfo.email) context += `Email: ${data.clientInfo.email}\n`
      if (data.clientInfo.phone) context += `Телефон: ${data.clientInfo.phone}\n`
      if (data.clientInfo.address) context += `Адрес: ${data.clientInfo.address}\n`
      if (data.clientInfo.additional_info) context += `Дополнительная информация: ${data.clientInfo.additional_info}\n`
      context += `Дата создания: ${new Date(data.clientInfo.created_at).toLocaleDateString('ru-RU')}\n\n`
    }

    if (data.includeClientDocuments && data.clientDocuments?.length) {
      context += `=== ДОКУМЕНТЫ КЛИЕНТА ===\n`
      data.clientDocuments.forEach((doc, index) => {
        context += `${index + 1}. ${doc.original_name} (${doc.file_type})\n`
        if (doc.transcription) {
          context += `   OCR текст: ${doc.transcription.substring(0, 200)}${doc.transcription.length > 200 ? '...' : ''}\n`
        }
        context += `   Загружен: ${new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}\n\n`
      })
    }

    if (data.includeCaseDocuments && data.caseDocuments?.length) {
      context += `=== ДОКУМЕНТЫ ДЕЛ КЛИЕНТА ===\n`
      data.caseDocuments.forEach((doc, index) => {
        context += `${index + 1}. ${doc.original_name} (${doc.file_type})\n`
        if (doc.transcription) {
          context += `   OCR текст: ${doc.transcription.substring(0, 200)}${doc.transcription.length > 200 ? '...' : ''}\n`
        }
        context += `   Загружен: ${new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}\n\n`
      })
    }

    return context
  }, [])

  // Загрузка контекста из кеша
  const loadContextFromCache = useCallback(async (clientId: string) => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('ai_context_cache')
        .select('*')
        .eq('entity_id', clientId)
        .eq('context_type', 'client')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setCache(data)
        // Проверяем не истек ли кеш
        if (new Date(data.expires_at) > new Date()) {
          return data.full_context
        }
      }

      return null
    } catch (error) {
      console.error('Ошибка загрузки кеша:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Сохранение контекста в кеш
  const saveContextToCache = useCallback(async (
    clientId: string, 
    contextData: AIContextData, 
    contextString: string
  ) => {
    try {
      const contextHash = generateContextHash(contextData)
      const contextSummary = `Клиент: ${contextData.clientInfo?.name || 'Неизвестно'} | Документы: ${(contextData.clientDocuments?.length || 0) + (contextData.caseDocuments?.length || 0)}`
      
      const cacheData = {
        context_type: 'client' as const,
        entity_id: clientId,
        context_hash: contextHash,
        context_summary: contextSummary,
        full_context: {
          clientInfo: contextData.clientInfo,
          clientDocuments: contextData.clientDocuments,
          caseDocuments: contextData.caseDocuments,
          contextString
        },
        token_count: Math.ceil(contextString.length / 4), // Примерная оценка токенов
        context_key: `client_${clientId}_${contextHash}`
      }

      const { data, error } = await supabase
        .from('ai_context_cache')
        .upsert(cacheData, { 
          onConflict: 'context_key',
          ignoreDuplicates: false 
        })
        .select('*')
        .single()

      if (error) throw error
      setCache(data)
      return data
    } catch (error) {
      console.error('Ошибка сохранения кеша:', error)
      throw error
    }
  }, [generateContextHash])

  // Очистка кеша
  const clearCache = useCallback(async (clientId?: string) => {
    try {
      setIsLoading(true)
      
      let query = supabase
        .from('ai_context_cache')
        .delete()

      if (clientId) {
        query = query.eq('entity_id', clientId).eq('context_type', 'client')
      }

      const { error } = await query

      if (error) throw error
      
      setCache(null)
      setContextData({
        includeClientInfo: false,
        includeClientDocuments: false,
        includeCaseDocuments: false
      })
    } catch (error) {
      console.error('Ошибка очистки кеша:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Загрузка документов клиента
  const loadClientDocuments = useCallback(async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Ошибка загрузки документов клиента:', error)
      return []
    }
  }, [])

  // Загрузка документов дел клиента
  const loadCaseDocuments = useCallback(async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select(`
          *,
          case:cases(*)
        `)
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Ошибка загрузки документов дел:', error)
      return []
    }
  }, [])

  // Инициализация контекста для клиента
  const initializeContext = useCallback(async (client: Client) => {
    try {
      setIsLoading(true)
      
      // Проверяем кеш
      const cachedContext = await loadContextFromCache(client.id)
      
      if (cachedContext) {
        setContextData({
          clientInfo: client,
          includeClientInfo: true,
          includeClientDocuments: false,
          includeCaseDocuments: false,
          clientDocuments: cachedContext.clientDocuments,
          caseDocuments: cachedContext.caseDocuments
        })
        return cachedContext
      }

      // Загружаем документы
      const [clientDocs, caseDocs] = await Promise.all([
        loadClientDocuments(client.id),
        loadCaseDocuments(client.id)
      ])

      const newContextData: AIContextData = {
        clientInfo: client,
        clientDocuments: clientDocs,
        caseDocuments: caseDocs,
        includeClientInfo: true,
        includeClientDocuments: false,
        includeCaseDocuments: false
      }

      setContextData(newContextData)
      return newContextData
    } catch (error) {
      console.error('Ошибка инициализации контекста:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [loadContextFromCache, loadClientDocuments, loadCaseDocuments])

  // Получение финального контекста для AI
  const getFinalContext = useCallback(async (): Promise<string> => {
    try {
      // Проверяем кеш
      if (cache && new Date(cache.expires_at) > new Date()) {
        return cache.full_context.contextString
      }

      // Строим новый контекст
      const contextString = buildContext(contextData)
      
      // Сохраняем в кеш если есть клиент
      if (contextData.clientInfo) {
        await saveContextToCache(contextData.clientInfo.id, contextData, contextString)
      }

      return contextString
    } catch (error) {
      console.error('Ошибка получения контекста:', error)
      return buildContext(contextData)
    }
  }, [contextData, cache, buildContext, saveContextToCache])

  return {
    contextData,
    setContextData,
    cache,
    isLoading,
    initializeContext,
    getFinalContext,
    clearCache,
    loadClientDocuments,
    loadCaseDocuments
  }
}