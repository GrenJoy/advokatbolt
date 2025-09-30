import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCurrentUser } from './useCurrentUser'

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

interface ContextOptions {
  includeClientInfo: boolean
  includeDocumentOCR: boolean
  includeLinkedCases: boolean
  includeNotes: boolean
}

export function useAIContext(entityType: 'client' | 'case', entityId: string) {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const [contextOptions, setContextOptions] = useState<ContextOptions>({
    includeClientInfo: true,
    includeDocumentOCR: false,
    includeLinkedCases: false,
    includeNotes: false
  })

  // Получение текущего кеша контекста
  const { data: contextCache, isLoading: cacheLoading } = useQuery({
    queryKey: ['ai-context-cache', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_context_cache')
        .select('*')
        .eq('context_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as AIContextCache | null
    },
    enabled: !!entityId
  })

  // Генерация контекста
  const generateContext = useMutation({
    mutationFn: async () => {
      let context: any = {
        entityType,
        entityId,
        timestamp: new Date().toISOString(),
        options: contextOptions
      }

      if (entityType === 'client') {
        // Получаем информацию о клиенте
        if (contextOptions.includeClientInfo) {
          const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', entityId)
            .single()
          
          context.clientInfo = client
        }

        // Получаем OCR текст из документов
        if (contextOptions.includeDocumentOCR) {
          const { data: documents } = await supabase
            .from('case_documents')
            .select('id, file_name, transcription, ocr_confidence')
            .eq('client_id', entityId)
            .eq('transcription_status', 'completed')
            .not('transcription', 'is', null)
            .order('uploaded_at', { ascending: false })
            .limit(20)

          context.documents = documents || []
          context.documentCount = documents?.length || 0
        }

        // Получаем связанные дела
        if (contextOptions.includeLinkedCases) {
          const { data: cases } = await supabase
            .from('cases')
            .select('id, title, case_number, status, description')
            .eq('client_id', entityId)
            .order('created_at', { ascending: false })

          context.linkedCases = cases || []
        }

        // Получаем заметки
        if (contextOptions.includeNotes) {
          const { data: noteLinks } = await supabase
            .from('note_links')
            .select(`
              notes(
                id,
                title,
                content,
                categories
              )
            `)
            .eq('client_id', entityId)

          context.notes = noteLinks?.map(link => link.notes) || []
        }
      }

      // Создаем хеш контекста
      const contextString = JSON.stringify(context)
      const contextHash = await generateHash(contextString)

      // Создаем саммари контекста
      const contextSummary = generateContextSummary(context)

      // Подсчитываем примерное количество токенов
      const tokenCount = estimateTokens(contextString)

      // Сохраняем в кеш
      const { data: cache, error } = await supabase
        .from('ai_context_cache')
        .insert({
          context_type: entityType,
          entity_id: entityId,
          context_hash: contextHash,
          context_summary: contextSummary,
          full_context: context,
          token_count: tokenCount,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
        })
        .select()
        .single()

      if (error) throw error
      return cache
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-context-cache', entityType, entityId] })
    }
  })

  // Очистка кеша
  const clearCache = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ai_context_cache')
        .delete()
        .eq('context_type', entityType)
        .eq('entity_id', entityId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-context-cache', entityType, entityId] })
    }
  })

  // Полная очистка всего кеша AI
  const clearAllCache = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ai_context_cache')
        .delete()
        .gte('created_at', '2000-01-01') // Удаляем все записи

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-context-cache'] })
    }
  })

  return {
    contextCache,
    cacheLoading,
    contextOptions,
    setContextOptions,
    generateContext: generateContext.mutate,
    clearCache: clearCache.mutate,
    clearAllCache: clearAllCache.mutate,
    isGenerating: generateContext.isPending,
    isClearing: clearCache.isPending || clearAllCache.isPending
  }
}

// Вспомогательные функции
async function generateHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

function generateContextSummary(context: any): string {
  let summary = `Контекст для ${context.entityType === 'client' ? 'клиента' : 'дела'}`
  
  if (context.clientInfo) {
    summary += ` "${context.clientInfo.name}"`
  }
  
  if (context.documentCount) {
    summary += `, ${context.documentCount} документов с OCR`
  }
  
  if (context.linkedCases?.length) {
    summary += `, ${context.linkedCases.length} связанных дел`
  }
  
  if (context.notes?.length) {
    summary += `, ${context.notes.length} заметок`
  }
  
  return summary
}

function estimateTokens(text: string): number {
  // Простая оценка: ~4 символа = 1 токен для русского текста
  return Math.ceil(text.length / 4)
}