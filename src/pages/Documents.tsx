import React, { useState } from 'react'
import { 
  Upload, 
  Search, 
  FileText, 
  Image, 
  Eye, 
  Download,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Tag
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'

interface Document {
  id: string
  name: string
  type: 'image' | 'pdf' | 'doc'
  size: string
  uploadDate: string
  caseTitle: string
  caseNumber: string
  ocrStatus: 'pending' | 'completed' | 'failed'
  extractedText?: string
  extractedDates?: string[]
  tags: string[]
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'prikaz_ob_uvolnenii.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2024-12-08',
    caseTitle: 'Трудовой спор ООО "Альфа"',
    caseNumber: 'A40-123456/2024',
    ocrStatus: 'completed',
    extractedText: 'ПРИКАЗ об увольнении работника от 15.11.2024...',
    extractedDates: ['15.11.2024', '01.12.2024'],
    tags: ['приказ', 'увольнение', 'основной документ']
  },
  {
    id: '2',
    name: 'trudovoy_dogovor.jpg',
    type: 'image',
    size: '1.8 MB',
    uploadDate: '2024-12-07',
    caseTitle: 'Трудовой спор ООО "Альфа"',
    caseNumber: 'A40-123456/2024',
    ocrStatus: 'completed',
    extractedText: 'ТРУДОВОЙ ДОГОВОР №123 от 15.01.2023...',
    extractedDates: ['15.01.2023'],
    tags: ['трудовой договор', 'основной документ']
  },
  {
    id: '3',
    name: 'spravka_o_zarplate.png',
    type: 'image',
    size: '956 KB',
    uploadDate: '2024-12-06',
    caseTitle: 'Трудовой спор ООО "Альфа"',
    caseNumber: 'A40-123456/2024',
    ocrStatus: 'pending',
    tags: ['справка', 'зарплата']
  },
  {
    id: '4',
    name: 'dogovor_kupli_prodazhi.pdf',
    type: 'pdf',
    size: '1.2 MB',
    uploadDate: '2024-12-05',
    caseTitle: 'Раздел имущества при разводе',
    caseNumber: 'С-456789/2024',
    ocrStatus: 'completed',
    extractedText: 'ДОГОВОР КУПЛИ-ПРОДАЖИ НЕДВИЖИМОСТИ от 20.05.2020...',
    extractedDates: ['20.05.2020'],
    tags: ['договор', 'недвижимость', 'имущество']
  }
]

function getFileIcon(type: string) {
  switch (type) {
    case 'image': return Image
    case 'pdf': return FileText
    case 'doc': return FileText
    default: return FileText
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return CheckCircle
    case 'pending': return Clock
    case 'failed': return AlertCircle
    default: return Clock
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100'
    case 'pending': return 'text-yellow-600 bg-yellow-100'
    case 'failed': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed': return 'OCR завершен'
    case 'pending': return 'Обработка OCR'
    case 'failed': return 'Ошибка OCR'
    default: return 'Неизвестно'
  }
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCase, setSelectedCase] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    onDrop: (acceptedFiles) => {
      // Handle file upload
      console.log('Files uploaded:', acceptedFiles)
    }
  })

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.extractedText && doc.extractedText.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCase = selectedCase === 'all' || doc.caseNumber === selectedCase
    
    return matchesSearch && matchesCase
  })

  const uniqueCases = [...new Set(mockDocuments.map(doc => doc.caseNumber))]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Документы</h1>
          <p className="text-slate-600">Все документы с автоматическим OCR распознаванием</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        {isDragActive ? (
          <div>
            <p className="text-blue-600 font-medium">Отпустите файлы для загрузки</p>
            <p className="text-slate-600 text-sm">Поддерживаются: JPG, PNG, PDF, DOC, DOCX</p>
          </div>
        ) : (
          <div>
            <p className="text-slate-900 font-medium mb-2">Перетащите файлы сюда или нажмите для выбора</p>
            <p className="text-slate-600 text-sm">Поддерживаются: JPG, PNG, PDF, DOC, DOCX</p>
            <p className="text-slate-500 text-xs mt-2">Автоматическое OCR распознавание текста</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по названию, делу или содержимому документа..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все дела</option>
              {uniqueCases.map(caseNumber => (
                <option key={caseNumber} value={caseNumber}>{caseNumber}</option>
              ))}
            </select>
            <button
              onClick={() => console.log('Documents filter clicked')}
              className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => {
          const FileIcon = getFileIcon(doc.type)
          const StatusIcon = getStatusIcon(doc.ocrStatus)
          
          return (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{doc.name}</h3>
                    <p className="text-sm text-slate-600">{doc.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocument(doc)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.caseTitle}</p>
                  <p className="text-xs text-slate-600">{doc.caseNumber}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.ocrStatus)}`}>
                    <StatusIcon className="w-3 h-3" />
                    {getStatusText(doc.ocrStatus)}
                  </div>
                </div>

                {doc.extractedDates && doc.extractedDates.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Найденные даты:</p>
                    <div className="flex flex-wrap gap-1">
                      {doc.extractedDates.map((date, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-600 mb-1">Теги:</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-600 bg-slate-100">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => console.log('Preview document', doc.id)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Просмотр
                </button>
                <button
                  onClick={() => console.log('Download document', doc.id)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => console.log('Delete document', doc.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">Загружен {new Date(doc.uploadDate).toLocaleDateString('ru-RU')}</p>
            </div>
          )
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Документы не найдены</h3>
          <p className="text-slate-600 mb-4">Попробуйте изменить параметры поиска или загрузите первый документ</p>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-full w-full flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{selectedDocument.name}</h2>
                <p className="text-slate-600">{selectedDocument.caseTitle} • {selectedDocument.caseNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedDocument(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {selectedDocument.ocrStatus === 'completed' && selectedDocument.extractedText ? (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Распознанный текст:</h3>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-slate-800 font-mono">
                      {selectedDocument.extractedText}
                    </pre>
                  </div>
                  
                  {selectedDocument.extractedDates && selectedDocument.extractedDates.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-slate-900 mb-2">Автоматически извлеченные даты:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.extractedDates.map((date, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {date}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedDocument.ocrStatus === 'pending' ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Обработка документа</h3>
                  <p className="text-slate-600">OCR распознавание текста в процессе...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Ошибка обработки</h3>
                  <p className="text-slate-600">Не удалось распознать текст в документе</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}