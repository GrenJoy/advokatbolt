import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  MoreVertical,
  Users,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
  Loader2,
  Eye
} from 'lucide-react'
import { Client } from '../types'
import { useClients, useDeleteClient } from '../hooks/useClients'
import { ClientForm } from '../components/ClientForm'

export default function Clients() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null)

  const { data: clients = [], isLoading, error } = useClients()
  const deleteClient = useDeleteClient()

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleAddClient = () => {
    setEditingClient(null)
    setIsFormOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
    setShowDeleteMenu(null)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      try {
        await deleteClient.mutateAsync(clientId)
        setShowDeleteMenu(null)
      } catch (error) {
        console.error('Ошибка при удалении клиента:', error)
      }
    }
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingClient(null)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Ошибка загрузки клиентов: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Клиенты</h1>
          <p className="text-slate-600">Управление базой клиентов</p>
        </div>
        <button
          onClick={handleAddClient}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          data-testid="button-add-client"
        >
          <Plus className="w-4 h-4" />
          Добавить клиента
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск по имени, email или телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="input-search-clients"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div 
            key={client.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{getInitials(client.name)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900" data-testid={`text-client-name-${client.id}`}>
                    {client.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Клиент с {new Date(client.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteMenu(showDeleteMenu === client.id ? null : client.id)
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  data-testid={`button-client-menu-${client.id}`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showDeleteMenu === client.id && (
                  <div 
                    className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Подробнее
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      data-testid={`button-edit-client-${client.id}`}
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center gap-2"
                      data-testid={`button-delete-client-${client.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${client.email}`} className="text-slate-700 hover:text-blue-600 transition-colors">
                  {client.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href={`tel:${client.phone}`} className="text-slate-700 hover:text-blue-600 transition-colors">
                  {client.phone}
                </a>
              </div>
              {client.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{client.address}</span>
                </div>
              )}
            </div>

            {/* Placeholder for statistics - можно будет добавить позже */}
            <div className="border-t border-slate-200 pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">0</p>
                  <p className="text-xs text-slate-600">Активные дела</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">0</p>
                  <p className="text-xs text-slate-600">Завершенные</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {Math.floor((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-xs text-slate-600">Дней назад</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {clients.length === 0 ? 'Нет клиентов' : 'Клиенты не найдены'}
          </h3>
          <p className="text-slate-600 mb-4">
            {clients.length === 0 
              ? 'Добавьте первого клиента для начала работы' 
              : 'Попробуйте изменить параметры поиска'
            }
          </p>
          <button
            onClick={handleAddClient}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            data-testid="button-add-first-client"
          >
            Добавить первого клиента
          </button>
        </div>
      )}

      <ClientForm
        client={editingClient}
        isOpen={isFormOpen}
        onClose={closeForm}
      />
    </div>
  )
}