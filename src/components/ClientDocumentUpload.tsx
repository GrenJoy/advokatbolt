import { useState, useRef, ChangeEvent } from 'react'
import {
  Upload,
  FileText,
  Image,
  X,
  Check,
  AlertCircle,
  Loader2,
  Download,
  Eye
} from 'lucide-react'
import { useDocuments } from '../hooks/useDocuments'
import { supabase } from '../lib/supabase'

interface ClientDocumentUploadProps {
  clientId: string
}

interface DocumentFile {
  id: string
  original_name: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  transcription: string | null
  transcription_status: string
  ocr_confidence: number
  uploaded_at: string
}

export default function ClientDocumentUpload({ clientId }: ClientDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: documents = [], isLoading, refetch } = useDocuments(clientId, 'client') as {
    data: DocumentFile[]
    isLoading: boolean
    refetch: () => void
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${clientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        // Загружаем файл в storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Создаем запись в базе данных
        const { error: dbError } = await supabase
          .from('case_documents')
          .insert({
            client_id: clientId,
            entity_type: 'client',
            file_name: fileName,
            original_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            transcription_status: file.type.startsWith('image/') ? 'pending' : 'skipped'
          })

        if (dbError) throw dbError
      }

      // Обновляем список документов
      refetch()
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Ошибка загрузки файла:', err)
      setError('Не удалось загрузить файл')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: DocumentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      // Создаем ссылку для скачивания
      const url = URL.createObjectURL(data)
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.original_name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Ошибка скачивания файла:', err)
      setError('Не удалось скачать файл')
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот документ?')) return

    try {
      const { error } = await supabase
        .from('case_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      refetch()
    } catch (err) {
      console.error('Ошибка удаления документа:', err)
      setError('Не удалось удалить документ')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    return FileText
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Загрузить документы
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Выбрать файлы
            </>
          )}
        </button>
        
        <p className="text-xs text-slate-500 mt-4">
          Поддерживаются: изображения (JPG, PNG), PDF, DOC, DOCX, TXT
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Documents List */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          Документы клиента ({documents.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Документы пока не загружены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.file_type)
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">
                        {doc.original_name}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}
                      </p>
                      
                      {/* OCR Status */}
                      {doc.file_type.startsWith('image/') && (
                        <div className="mt-2">
                          {doc.transcription_status === 'completed' ? (
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <Check className="w-4 h-4" />
                              OCR выполнен ({(doc.ocr_confidence * 100).toFixed(0)}%)
                            </div>
                          ) : doc.transcription_status === 'pending' ? (
                            <div className="flex items-center gap-1 text-sm text-yellow-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              OCR обрабатывается...
                            </div>
                          ) : doc.transcription_status === 'failed' ? (
                            <div className="flex items-center gap-1 text-sm text-red-600">
                              <X className="w-4 h-4" />
                              Ошибка OCR
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Скачать"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {doc.transcription && (
                        <button
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Посмотреть OCR текст"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}