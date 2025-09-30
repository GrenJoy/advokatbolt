import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
  Briefcase,
  Clock
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Client, Case } from '../types'
import { ClientAIChat } from '../components/ClientAIChat'
import { ClientDocumentUpload } from '../components/ClientDocumentUpload'
import { DocumentsList } from '../components/DocumentsList'
import { ClientForm } from '../components/ClientForm'
import { useDeleteClient } from '../hooks/useClients'

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const deleteClient = useDeleteClient()
  const [activeTab, setActiveTab] = useState<'info' | 'cases' | 'documents' | 'ai-chat'>('info')
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  // Получение данных клиента
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Client
    },
    enabled: !!id
  })

  // Получение связанных дел
  const { data: clientCases = [] } = useQuery({
    queryKey: ['client-cases', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Case[]
    },
    enabled: !!id
  })

  // Получение количества документов
  const { data: documentCount = 0 } = useQuery({
    queryKey: ['client-document-count', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('case_documents')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id)
      
      if (error) throw error
      return count || 0
    },
    enabled: !!id
  })

  const handleDeleteClient = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента? Это действие нельзя отменить.')) {
      try {
        await deleteClient.mutateAsync(id!)
        navigate('/clients')
      } catch (error) {
        console.error('Ошибка при удалении клиента:', error)
      }
    }
  }

  if (clientLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Клиент не найден
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{getInitials(client.name)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-slate-600">
                Клиент с {new Date(client.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditFormOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </button>
          <button
            onClick={handleDeleteClient}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Информация
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cases'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Дела ({clientCases.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Документы ({documentCount})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ai-chat')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ai-chat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                AI Чат
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Контактная информация</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                          {client.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">Телефон</p>
                        <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    </div>
                    {client.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                        <div>
                          <p className="text-sm text-slate-600">Адрес</p>
                          <p className="text-slate-900">{client.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Дополнительная информация</h3>
                  {client.additional_info ? (
                    <p className="text-slate-700 whitespace-pre-wrap">{client.additional_info}</p>
                  ) : (
                    <p className="text-slate-500 italic">Нет дополнительной информации</p>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-slate-900">Активные дела</h4>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {clientCases.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-slate-900">Документов</h4>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{documentCount}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-slate-900">Дней с нами</h4>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="space-y-4">
              {clientCases.length > 0 ? (
                clientCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/cases/${case_.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{case_.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {case_.case_number} • {case_.case_type}
                        </p>
                        {case_.description && (
                          <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                            {case_.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          case_.status === 'active' ? 'bg-green-100 text-green-700' :
                          case_.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {case_.status === 'active' ? 'Активное' :
                           case_.status === 'completed' ? 'Завершено' :
                           'Архив'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(case_.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">У клиента пока нет дел</p>
                  <button
                    onClick={() => navigate('/cases/new')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Создать дело
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <ClientDocumentUpload clientId={client.id} />
              <DocumentsList 
                entityType="client" 
                entityId={client.id} 
              />
            </div>
          )}

          {activeTab === 'ai-chat' && (
            <div className="h-[600px]">
              <ClientAIChat client={client} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      <ClientForm
        client={client}
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
      />
    </div>
  )
}