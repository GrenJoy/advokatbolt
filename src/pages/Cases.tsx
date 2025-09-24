import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Briefcase,
  Calendar,
  User,
  Tag,
  AlertCircle
} from 'lucide-react'
import { Case } from '../types'

const mockCases: Case[] = [
  {
    id: '1',
    case_number: 'A40-123456/2024',
    title: 'Трудовой спор ООО "Альфа"',
    description: 'Восстановление на работе и взыскание компенсации морального вреда',
    status: 'active',
    priority: 'high',
    client_id: '1',
    client: {
      id: '1',
      name: 'Иванов Иван Иванович',
      email: 'ivanov@example.com',
      phone: '+7 (999) 123-45-67',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    case_type: 'Трудовое право',
    court_instance: 'Арбитражный суд г. Москвы',
    opposing_party: 'ООО "Альфа"',
    tags: ['трудовой спор', 'восстановление', 'компенсация'],
    created_at: '2024-12-01',
    updated_at: '2024-12-08'
  },
  {
    id: '2',
    case_number: 'С-456789/2024',
    title: 'Раздел имущества при разводе',
    description: 'Раздел совместно нажитого имущества супругов',
    status: 'active',
    priority: 'medium',
    client_id: '2',
    client: {
      id: '2',
      name: 'Петрова Анна Владимировна',
      email: 'petrova@example.com',
      phone: '+7 (999) 234-56-78',
      created_at: '2024-01-15',
      updated_at: '2024-01-15'
    },
    case_type: 'Семейное право',
    court_instance: 'Городской суд',
    opposing_party: 'Петров В.И.',
    tags: ['развод', 'имущество', 'раздел'],
    created_at: '2024-11-15',
    updated_at: '2024-12-07'
  },
  {
    id: '3',
    case_number: 'Г-789012/2024',
    title: 'Взыскание долга по договору',
    description: 'Взыскание задолженности по договору поставки товаров',
    status: 'paused',
    priority: 'low',
    client_id: '3',
    client: {
      id: '3',
      name: 'ИП Сидоров Сергей Петрович',
      email: 'sidorov@example.com',
      phone: '+7 (999) 345-67-89',
      created_at: '2024-02-01',
      updated_at: '2024-02-01'
    },
    case_type: 'Гражданское право',
    court_instance: 'Мировой суд',
    opposing_party: 'ООО "Бета"',
    tags: ['долг', 'договор', 'поставка'],
    created_at: '2024-10-01',
    updated_at: '2024-12-05'
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'paused': return 'bg-yellow-100 text-yellow-800'
    case 'completed': return 'bg-blue-100 text-blue-800'
    case 'archived': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-blue-100 text-blue-800'
    case 'low': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'active': return 'Активное'
    case 'paused': return 'Приостановлено'
    case 'completed': return 'Завершено'
    case 'archived': return 'Архив'
    default: return status
  }
}

function getPriorityText(priority: string) {
  switch (priority) {
    case 'urgent': return 'Срочный'
    case 'high': return 'Высокий'
    case 'medium': return 'Средний'
    case 'low': return 'Низкий'
    default: return priority
  }
}

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  const filteredCases = mockCases.filter(case_item => {
    const matchesSearch = case_item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_item.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_item.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || case_item.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Дела</h1>
          <p className="text-slate-600">Управление всеми делами вашей практики</p>
        </div>
        <button
          onClick={() => console.log('Create Case clicked')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать дело
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по названию, номеру дела, клиенту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="paused">Приостановленные</option>
              <option value="completed">Завершенные</option>
              <option value="archived">Архивные</option>
            </select>
            <button
              onClick={() => console.log('Filters clicked')}
              className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.map((case_item) => (
          <div key={case_item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{case_item.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{case_item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {case_item.case_number}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {case_item.client?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(case_item.updated_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => console.log('Case menu clicked', case_item.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(case_item.status)}`}>
                      {getStatusText(case_item.status)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(case_item.priority)}`}>
                      {getPriorityText(case_item.priority)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {case_item.case_type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {case_item.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-600 bg-slate-100">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {case_item.priority === 'urgent' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Срочное дело - требует немедленного внимания
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Дела не найдены</h3>
          <p className="text-slate-600 mb-4">Попробуйте изменить параметры поиска</p>
          <button
            onClick={() => console.log('Create first case clicked')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Создать первое дело
          </button>
        </div>
      )}
    </div>
  )
}