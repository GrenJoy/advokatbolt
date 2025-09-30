import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Briefcase,
  MessageSquare,
  Info,
  Loader2
} from 'lucide-react'
import { Client } from '../types'
import { useClients } from '../hooks/useClients'
import { ClientForm } from '../components/ClientForm'
import ClientAIChat from '../components/ClientAIChat'
import { supabase } from '../lib/supabase'

interface ClientDocument {
  id: string
  case_id: string | null
  client_id: string
  entity_type: string
  file_name: string
  original_name: string
  file_path: string
  file_size: number
  file_type: string
  document_type: string | null
  transcription: string | null
  transcription_status: string
  ocr_confidence: number
  ocr_language: string
  uploaded_at: string
}

interface ClientCase {
  id: string
  case_id: string
  client_id: string
  role: string
  notes: string | null
  created_at: string
  case: {
    id: string
    title: string
    case_number: string | null
    status: string
    case_type: string | null
    created_at: string
  }
}

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'cases' | 'ai-chat'>('info')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [cases, setCases] = useState<ClientCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false)
  const [isCasesLoading, setIsCasesLoading] = useState(false)

  const { data: clients = [] } = useClients()
  const client = clients.find(c => c.id === id)

  // Загрузка документов клиента
  const loadDocuments = async () => {
    if (!client?.id) return
    
    setIsDocumentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('client_id', client.id)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Ошибка загрузки документов:', error)
    } finally {
      setIsDocumentsLoading(false)
    }
  }

  // Загрузка дел клиента
  const loadCases = async () => {
    if (!client?.id) return
    
    setIsCasesLoading(true)
    try {
      const { data, error } = await supabase
        .from('case_clients')
        .select(`
          *,
          case:cases(*)
        `)
        .eq('client_id', client.id)

      if (error) throw error
      setCases(data || [])
    } catch (error) {
      console.error('Ошибка загрузки дел:', error)
    } finally {
      setIsCasesLoading(false)
    }
  }

  // Инициализация данных
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          loadDocuments(),
          loadCases()
        ])
      } finally {
        setIsLoading(false)
      }
    }

    if (client?.id) {
      init()
    }
  }, [client?.id])

  if (!client) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600">Загрузка клиента...</p>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const tabs = [
    { id: 'info', label: 'Информация', icon: Info },
    { id: 'documents', label: 'Документы', icon: FileText, count: documents.length },
    { id: 'cases', label: 'Дела', icon: Briefcase, count: cases.length },
    { id: 'ai-chat', label: 'AI Чат', icon: MessageSquare }
  ]

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">{getInitials(client.name)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-slate-600">Клиент с {new Date(client.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Редактировать
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="h-full">
        {activeTab === 'info' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Контактная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <a href={`mailto:${client.email}`} className="text-slate-900 hover:text-blue-600 transition-colors">
                      {client.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Телефон</p>
                    <a href={`tel:${client.phone}`} className="text-slate-900 hover:text-blue-600 transition-colors">
                      {client.phone}
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">Адрес</p>
                      <p className="text-slate-900">{client.address}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Дата создания</p>
                    <p className="text-slate-900">{new Date(client.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {client.additional_info && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Дополнительная информация</h3>
                <p className="text-slate-900 whitespace-pre-wrap">{client.additional_info}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Документы клиента</h2>
              <button
                onClick={loadDocuments}
                disabled={isDocumentsLoading}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                {isDocumentsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Обновить
              </button>
            </div>
            
            {isDocumentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Документы не найдены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{doc.original_name}</p>
                        <p className="text-sm text-slate-600">
                          {doc.file_type} • {formatFileSize(doc.file_size)} • 
                          {new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}
                        </p>
                        {doc.transcription && (
                          <p className="text-xs text-slate-500 mt-1">
                            OCR: {doc.transcription.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doc.transcription_status === 'completed' 
                          ? 'bg-green-100 text-green-700'
                          : doc.transcription_status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {doc.transcription_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Дела клиента</h2>
              <button
                onClick={loadCases}
                disabled={isCasesLoading}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                {isCasesLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Briefcase className="w-4 h-4" />
                )}
                Обновить
              </button>
            </div>
            
            {isCasesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Дела не найдены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((clientCase) => (
                  <div key={clientCase.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900">{clientCase.case.title}</h3>
                        <p className="text-sm text-slate-600">
                          Роль: {clientCase.role} • 
                          {clientCase.case.case_number && ` Номер: ${clientCase.case.case_number} • `}
                          Статус: {clientCase.case.status}
                        </p>
                        {clientCase.notes && (
                          <p className="text-sm text-slate-600 mt-1">{clientCase.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/cases/${clientCase.case.id}`)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Открыть дело
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai-chat' && client && (
          <ClientAIChat client={client} />
        )}
      </div>

      {/* Edit Modal */}
      <ClientForm
        client={client}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  )
}