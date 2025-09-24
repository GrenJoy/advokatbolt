import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  MoreVertical,
  Users,
  Calendar,
  Briefcase
} from 'lucide-react'
import { Client } from '../types'

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Иванов Иван Иванович',
    email: 'ivanov@example.com',
    phone: '+7 (999) 123-45-67',
    address: 'г. Москва, ул. Ленина, д. 1, кв. 10',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    name: 'Петрова Анна Владимировна',
    email: 'petrova@example.com',
    phone: '+7 (999) 234-56-78',
    address: 'г. Москва, пр. Мира, д. 15, кв. 25',
    created_at: '2024-01-15',
    updated_at: '2024-01-15'
  },
  {
    id: '3',
    name: 'ИП Сидоров Сергей Петрович',
    email: 'sidorov@example.com',
    phone: '+7 (999) 345-67-89',
    address: 'г. Москва, ул. Тверская, д. 30, офис 301',
    created_at: '2024-02-01',
    updated_at: '2024-02-01'
  }
]

// Mock data for client statistics
const clientStats = {
  '1': { activeCases: 1, completedCases: 3, lastContact: '2024-12-08' },
  '2': { activeCases: 1, completedCases: 0, lastContact: '2024-12-07' },
  '3': { activeCases: 1, completedCases: 2, lastContact: '2024-12-05' },
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredClients = mockClients.filter(client =>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Клиенты</h1>
          <p className="text-slate-600">Управление базой клиентов</p>
        </div>
        <button
          onClick={() => console.log('Add Client clicked')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const stats = clientStats[client.id as keyof typeof clientStats]
          
          return (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{getInitials(client.name)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-600">Клиент с {new Date(client.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
                <button
                  onClick={() => console.log('Client menu clicked', client.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
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

              {/* Statistics */}
              <div className="border-t border-slate-200 pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{stats.activeCases}</p>
                    <p className="text-xs text-slate-600">Активные дела</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{stats.completedCases}</p>
                    <p className="text-xs text-slate-600">Завершенные</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {Math.floor((new Date().getTime() - new Date(stats.lastContact).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-xs text-slate-600">Дней назад</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => console.log('Open cases for client', client.id)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Открыть дела
                  </button>
                  <button
                    onClick={() => console.log('Edit client', client.id)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Клиенты не найдены</h3>
          <p className="text-slate-600 mb-4">Попробуйте изменить параметры поиска или добавьте первого клиента</p>
          <button
            onClick={() => console.log('Add first client clicked')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Добавить первого клиента
          </button>
        </div>
      )}
    </div>
  )
}