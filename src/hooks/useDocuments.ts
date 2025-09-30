import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../lib/api'
import { processDocumentOCR } from '../lib/gemini'
import type { CaseDocument } from '../types'

// Получить документы дела или клиента
export function useDocuments(entityId: string, entityType: 'case' | 'client' = 'case') {
  return useQuery({
    queryKey: ['/api/documents', entityId, entityType],
    queryFn: () => {
      if (entityType === 'client') {
        return documentsApi.getByClientId(entityId)
      }
      return documentsApi.getByCaseId(entityId)
    },
    enabled: !!entityId
  })
}

// Загрузить и обработать документ
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      file, 
      caseId, 
      documentType 
    }: { 
      file: File
      caseId: string
      documentType?: string 
    }): Promise<CaseDocument> => {
      
      // 1. Загрузить файл в Supabase Storage
      const filePath = await documentsApi.uploadFile(file, caseId)
      
      // 2. Создать запись о документе
      const document = await documentsApi.create({
        case_id: caseId,
        file_name: file.name,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        document_type: documentType || 'other',
        transcription_status: 'pending'
      })

      // 3. Обработать OCR (асинхронно)
      try {
        const ocrResult = await processDocumentOCR(file)
        
        // 4. Обновить документ с результатами OCR
        const updatedDocument = await documentsApi.updateOCR(
          document.id,
          ocrResult.extractedText,
          [], // TODO: извлечь даты из текста
          []  // TODO: извлечь номера из текста
        )
        
        return updatedDocument
      } catch (ocrError) {
        console.error('Ошибка OCR обработки:', ocrError)
        
        // Обновить статус как ошибка
        const errorDocument = await documentsApi.updateOCR(
          document.id,
          'Ошибка при обработке OCR'
        )
        
        return errorDocument
      }
    },
    onSuccess: (data) => {
      // Обновить кеш документов для этого дела
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', data.case_id] 
      })
    }
  })
}

// Удалить документ
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      filePath, 
      entityId,
      entityType = 'case' 
    }: { 
      documentId: string
      filePath: string
      entityId: string
      entityType?: 'case' | 'client'
    }) => {
      await documentsApi.delete(documentId, filePath)
      return { documentId, entityId, entityType }
    },
    onSuccess: (data) => {
      // Обновить кеш документов
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', data.entityId, data.entityType] 
      })
    }
  })
}

// Переобработать OCR документа
export function useReprocessOCR() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      file
    }: { 
      documentId: string
      file: File
    }): Promise<CaseDocument> => {
      
      const ocrResult = await processDocumentOCR(file)
      
      const updatedDocument = await documentsApi.updateOCR(
        documentId,
        ocrResult.extractedText,
        [], // TODO: извлечь даты
        []  // TODO: извлечь номера
      )
      
      return updatedDocument
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/documents', data.case_id] 
      })
    }
  })
}