import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Briefcase,
  Edit,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { useClients, useUpdateClient } from '../hooks/useClients'
import { useCases } from '../hooks/useCases'
import ClientDocumentUpload from '../components/ClientDocumentUpload'
import ClientAIChat from '../components/ClientAIChat'

type TabType = 'info' | 'cases' | 'documents' | 'ai-chat'

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    additional_info: ''
  })

  const { data: clients = [], isLoading: isLoadingClients } = useClients()
  const { data: cases = [], isLoading: isLoadingCases } = useCases()
  const updateClient = useUpdateClient()

  const client = clients.find(c => c.id === id)
  const clientCases = cases.filter(c => c.client_id === id)

  // Загружаем данные клиента в форму при включении редактирования
  useEffect(() => {
    if (isEditing && client) {
      setEditForm({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address || '',
        additional_info: client.additional_info || ''
      })
    }
  }, [isEditing, client])

  if (isLoadingClients) {
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
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к списку клиентов
        </button>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        updates: editForm
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  const tabs = [
    { id: 'info' as TabType, label: 'Информация', icon: User },
    { id: 'cases' as TabType, label: 'Дела', icon: Briefcase, count: clientCases.length },
    { id: 'documents' as TabType, label: 'Документы', icon: FileText },
    { id: 'ai-chat' as TabType, label: 'AI Чат', icon: MessageSquare }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <p className="text-slate-600">
              Клиент с {new Date(client.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
        
        {activeTab === 'info' && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateClient.isPending}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {updateClient.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Сохранить
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Отмена
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Редактировать
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Имя
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900">{client.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Телефон
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Адрес
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-slate-900 flex items-start gap-2">
                      {client.address ? (
                        <>
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                          {client.address}
                        </>
                      ) : (
                        <span className="text-slate-400">Не указан</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Дополнительная информация
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.additional_info}
                    onChange={(e) => setEditForm({ ...editForm, additional_info: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-slate-900 whitespace-pre-wrap">
                    {client.additional_info || <span className="text-slate-400">Не указана</span>}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Статистика</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-slate-600">Активные дела</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">
                      {clientCases.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-slate-600">Всего дел</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">
                      {clientCases.length}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-slate-600">Дней с нами</span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">
                      {Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cases Tab */}
          {activeTab === 'cases' && (
            <div>
              {isLoadingCases ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : clientCases.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">У клиента пока нет дел</p>
                  <button
                    onClick={() => navigate('/cases/new')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Создать дело
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientCases.map((case_) => (
                    <div
                      key={case_.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/cases/${case_.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900">{case_.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{case_.case_number}</p>
                          {case_.description && (
                            <p className="text-sm text-slate-700 mt-2">{case_.description}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          case_.status === 'active' ? 'bg-green-100 text-green-700' :
                          case_.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                          case_.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {case_.status === 'active' ? 'Активно' :
                           case_.status === 'paused' ? 'Приостановлено' :
                           case_.status === 'completed' ? 'Завершено' :
                           'Архив'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <ClientDocumentUpload clientId={client.id} />
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'ai-chat' && (
            <div className="h-[600px]">
              <ClientAIChat clientId={client.id} clientName={client.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}