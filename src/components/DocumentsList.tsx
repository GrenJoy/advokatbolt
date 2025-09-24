import { useState } from 'react'
import { 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  X
} from 'lucide-react'
import { useDocuments, useDeleteDocument, useReprocessOCR } from '../hooks/useDocuments'
import { supabase } from '../lib/supabase'
import type { CaseDocument } from '../types'

interface DocumentsListProps {
  caseId: string
}

export function DocumentsList({ caseId }: DocumentsListProps) {
  const { data: documents = [], isLoading, error } = useDocuments(caseId)
  const deleteDocument = useDeleteDocument()
  const reprocessOCR = useReprocessOCR()
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<CaseDocument | null>(null)

  const handleDownload = async (document: CaseDocument) => {
    try {
      const { data } = await supabase.storage
        .from('case-documents')
        .download(document.file_path)
      
      if (data) {
        const url = URL.createObjectURL(data)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.file_name
        window.document.body.appendChild(a)
        a.click()
        window.document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error)
    }
  }

  const handleDelete = async (document: CaseDocument) => {
    if (window.confirm(`Вы уверены, что хотите удалить документ "${document.file_name}"?`)) {
      try {
        await deleteDocument.mutateAsync({
          documentId: document.id,
          filePath: document.file_path,
          caseId
        })
        setShowMenu(null)
      } catch (error) {
        console.error('Ошибка при удалении документа:', error)
      }
    }
  }

  const handleReprocess = async (document: CaseDocument) => {
    // Получить файл из Storage для переобработки
    try {
      const { data } = await supabase.storage
        .from('case-documents')
        .download(document.file_path)
      
      if (data) {
        const file = new File([data], document.file_name, { type: document.file_type })
        await reprocessOCR.mutateAsync({
          documentId: document.id,
          file
        })
        setShowMenu(null)
      }
    } catch (error) {
      console.error('Ошибка при переобработке документа:', error)
    }
  }

  const getFileIcon = (document: CaseDocument) => {
    if (document.file_type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />
    }
    return <FileText className="w-5 h-5 text-slate-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Обработан'
      case 'processing':
        return 'Обрабатывается'
      case 'failed':
        return 'Ошибка'
      default:
        return 'В очереди'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return <div className="text-slate-500">Загрузка документов...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Ошибка загрузки документов: {error.message}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Нет загруженных документов</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <div key={document.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getFileIcon(document)}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 truncate" data-testid={`text-document-name-${document.id}`}>
                  {document.file_name}
                </h4>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <span>{formatFileSize(document.file_size)}</span>
                  <span className="capitalize">{document.document_type}</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(document.transcription_status)}
                    {getStatusText(document.transcription_status)}
                  </div>
                </div>
                
                {document.transcription && document.transcription_status === 'completed' && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 line-clamp-3">
                      {document.transcription.slice(0, 200)}...
                    </p>
                    <button
                      onClick={() => setViewingDocument(document)}
                      className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                      data-testid={`button-view-document-${document.id}`}
                    >
                      Показать полный текст
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(showMenu === document.id ? null : document.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                data-testid={`button-document-menu-${document.id}`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMenu === document.id && (
                <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                  <button
                    onClick={() => setViewingDocument(document)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg flex items-center gap-2"
                    data-testid={`button-view-text-${document.id}`}
                  >
                    <Eye className="w-4 h-4" />
                    Просмотреть текст
                  </button>
                  <button
                    onClick={() => handleDownload(document)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    data-testid={`button-download-${document.id}`}
                  >
                    <Download className="w-4 h-4" />
                    Скачать
                  </button>
                  {document.file_type.startsWith('image/') && (
                    <button
                      onClick={() => handleReprocess(document)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      data-testid={`button-reprocess-${document.id}`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Переобработать OCR
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(document)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
                    data-testid={`button-delete-document-${document.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Модальное окно для просмотра текста */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {viewingDocument.file_name}
              </h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                data-testid="button-close-document-viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                {viewingDocument.transcription || 'Текст не распознан'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}