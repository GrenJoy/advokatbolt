import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface BuildContextOptions {
  clientId: string
  systemPrompt?: string
  includeClientInfo: boolean
  includeOCR: boolean
}

export interface BuiltContextResult {
  contextText: string
  tokenCount: number
}

export function useAIContext() {
  const [isBuilding, setIsBuilding] = useState(false)

  const buildContext = useCallback(async (options: BuildContextOptions): Promise<BuiltContextResult> => {
    setIsBuilding(true)
    try {
      const sections: string[] = []

      if (options.systemPrompt && options.systemPrompt.trim().length > 0) {
        sections.push(`Системный промпт:\n${options.systemPrompt.trim()}`)
      }

      if (options.includeClientInfo) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('name, email, phone, address, additional_info')
          .eq('id', options.clientId)
          .single()

        if (clientError) throw clientError

        const clientInfoLines = [
          client?.name ? `Имя: ${client.name}` : undefined,
          client?.email ? `Email: ${client.email}` : undefined,
          client?.phone ? `Телефон: ${client.phone}` : undefined,
          client?.address ? `Адрес: ${client.address}` : undefined,
          client?.additional_info ? `Особая информация: ${client.additional_info}` : undefined,
        ].filter(Boolean) as string[]

        if (clientInfoLines.length > 0) {
          sections.push(`Информация о клиенте:\n${clientInfoLines.join('\n')}`)
        }
      }

      if (options.includeOCR) {
        const { data: docs, error: docsError } = await supabase
          .from('case_documents')
          .select('transcription')
          .eq('client_id', options.clientId)
          .neq('transcription', null)
          .order('uploaded_at', { ascending: false })

        if (docsError) throw docsError

        const ocrTexts = (docs || [])
          .map((d: { transcription?: string }) => d.transcription)
          .filter(Boolean) as string[]

        if (ocrTexts.length > 0) {
          const joined = ocrTexts.join('\n---\n')
          sections.push(`OCR тексты, связанные с клиентом:\n${joined}`)
        }
      }

      const contextText = sections.join('\n\n')
      const tokenCount = Math.ceil(contextText.length / 4) // грубая оценка

      return { contextText, tokenCount }
    } finally {
      setIsBuilding(false)
    }
  }, [])

  const saveContextCache = useCallback(async (clientId: string, contextText: string) => {
    if (!contextText || contextText.trim().length === 0) return
    const contextHash = String(contextText.length)
    const { error } = await supabase
      .from('ai_context_cache')
      .insert([
        {
          context_type: 'client',
          entity_id: clientId,
          context_hash: contextHash,
          context_summary: contextText.slice(0, 200),
          full_context: { text: contextText },
          token_count: Math.ceil(contextText.length / 4),
          context_key: `client:${clientId}`
        }
      ])
    if (error) throw error
  }, [])

  const clearContextCache = useCallback(async (clientId: string) => {
    const { error } = await supabase
      .from('ai_context_cache')
      .delete()
      .eq('context_type', 'client')
      .eq('entity_id', clientId)
    if (error) throw error
  }, [])

  return { isBuilding, buildContext, saveContextCache, clearContextCache }
}

