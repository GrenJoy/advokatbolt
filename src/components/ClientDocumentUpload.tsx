import React, { useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/use-toast'

interface ClientDocumentUploadProps {
  clientId: string
}

export function ClientDocumentUpload({ clientId }: ClientDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Загружаем файл в storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `client-documents/${clientId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Создаем запись в базе данных
      const { data, error: dbError } = await supabase
        .from('case_documents')
        .insert({
          client_id: clientId,
          entity_type: 'client',
          file_name: fileName,
          original_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          document_type: getDocumentType(file.type),
          transcription_status: isImageFile(file) ? 'pending' : 'skipped'
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Если это изображение, запускаем OCR
      if (isImageFile(file) && data) {
        startOCRProcessing(data.id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] })
      queryClient.invalidateQueries({ queryKey: ['client-document-count', clientId] })
      toast({
        title: 'Документ загружен',
        description: 'Документ успешно загружен и сохранен',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка загрузки',
        description: error.message || 'Не удалось загрузить документ',
        variant: 'destructive'
      })
    }
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    setIsUploading(true)
    const filesArray = Array.from(files)

    for (const file of filesArray) {
      await uploadMutation.mutateAsync(file)
    }

    setIsUploading(false)
  }

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
  }

  const getDocumentType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet'
    return 'other'
  }

  const startOCRProcessing = async (documentId: string) => {
    try {
      await fetch('/api/ocr/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId })
      })
    } catch (error) {
      console.error('Ошибка запуска OCR:', error)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 hover:border-slate-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="client-file-upload"
        multiple
        onChange={handleChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        disabled={isUploading}
      />

      <label
        htmlFor="client-file-upload"
        className="cursor-pointer"
      >
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">Загрузка документов...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-sm text-slate-700">
                  Перетащите файлы сюда или{' '}
                  <span className="text-blue-600 hover:text-blue-700">выберите файлы</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Поддерживаются изображения, PDF, Word, Excel
                </p>
              </div>
            </>
          )}
        </div>
      </label>
    </div>
  )
}