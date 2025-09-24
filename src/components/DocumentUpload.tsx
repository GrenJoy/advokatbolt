import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, CheckCircle, Loader2, FileText, Image } from 'lucide-react'
import { useUploadDocument } from '../hooks/useDocuments'

interface DocumentUploadProps {
  caseId: string
  onUploadComplete?: () => void
}

interface UploadProgress {
  file: File
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  progress: number
}

export function DocumentUpload({ caseId, onUploadComplete }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const uploadDocument = useUploadDocument()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      status: 'uploading',
      progress: 0
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Обработать каждый файл
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const uploadIndex = uploads.length + i

      try {
        // Обновить статус на "загрузка"
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'uploading', progress: 30 }
            : upload
        ))

        // Определить тип документа по расширению
        const documentType = getDocumentType(file.name)

        // Загрузить файл
        await uploadDocument.mutateAsync({
          file,
          caseId,
          documentType
        })

        // Обновить статус на "завершено"
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { ...upload, status: 'completed', progress: 100 }
            : upload
        ))

        onUploadComplete?.()

      } catch (error) {
        // Обновить статус на "ошибка"
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { 
                ...upload, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Ошибка загрузки',
                progress: 0
              }
            : upload
        ))
      }
    }
  }, [caseId, uploadDocument, uploads.length, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />
    }
    return <FileText className="w-5 h-5 text-slate-500" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">Документы дела</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          data-testid="button-toggle-upload"
        >
          <Upload className="w-4 h-4" />
          Загрузить документы
        </button>
      </div>

      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
            data-testid="dropzone"
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Отпустите файлы для загрузки...</p>
            ) : (
              <div>
                <p className="text-slate-600 mb-2">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-sm text-slate-500">
                  Поддерживаются: изображения, PDF, Word, TXT (макс. 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Прогресс загрузки */}
          {uploads.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">Загружаемые файлы</h4>
                {uploads.some(u => u.status === 'completed') && (
                  <button
                    onClick={clearCompleted}
                    className="text-sm text-slate-500 hover:text-slate-700"
                    data-testid="button-clear-completed"
                  >
                    Очистить завершенные
                  </button>
                )}
              </div>

              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {getFileIcon(upload.file)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {upload.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {upload.status === 'error' && upload.error && (
                      <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {upload.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                    {upload.status === 'processing' && (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    )}
                    {upload.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    
                    <button
                      onClick={() => removeUpload(index)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      data-testid={`button-remove-upload-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getDocumentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  
  switch (ext) {
    case 'pdf':
      return 'contract'
    case 'doc':
    case 'docx':
      return 'motion'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
      return 'evidence'
    default:
      return 'other'
  }
}