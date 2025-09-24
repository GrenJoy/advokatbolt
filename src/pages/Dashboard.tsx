import React from 'react'
import { 
  Briefcase, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Scale
} from 'lucide-react'

const stats = [
  {
    name: 'Активные дела',
    value: '12',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    change: '+2 за неделю'
  },
  {
    name: 'Клиенты',
    value: '24',
    icon: Users,
    color: 'text-green-600',
    bg: 'bg-green-100',
    change: '+3 за месяц'
  },
  {
    name: 'Ближайшие события',
    value: '5',
    icon: Calendar,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    change: 'на этой неделе'
  },
  {
    name: 'Завершенные дела',
    value: '8',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    change: 'в этом месяце'
  },
]

const recentCases = [
  {
    id: '1',
    title: 'Трудовой спор ООО "Альфа"',
    client: 'Иванов И.И.',
    status: 'active',
    priority: 'high',
    updatedAt: '2 часа назад'
  },
  {
    id: '2',
    title: 'Раздел имущества при разводе',
    client: 'Петрова А.В.',
    status: 'active',
    priority: 'medium',
    updatedAt: '1 день назад'
  },
  {
    id: '3',
    title: 'Взыскание долга по договору',
    client: 'ИП Сидоров',
    status: 'paused',
    priority: 'low',
    updatedAt: '3 дня назад'
  },
]

const upcomingEvents = [
  {
    id: '1',
    title: 'Судебное заседание по делу №А40-123456',
    date: '2025-01-10',
    time: '10:00',
    type: 'court_hearing'
  },
  {
    id: '2',
    title: 'Встреча с клиентом Ивановым И.И.',
    date: '2025-01-12',
    time: '14:00',
    type: 'meeting'
  },
  {
    id: '3',
    title: 'Подача искового заявления',
    date: '2025-01-15',
    time: '09:00',
    type: 'deadline'
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800'
    case 'paused': return 'bg-yellow-100 text-yellow-800'
    case 'completed': return 'bg-blue-100 text-blue-800'
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

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Обзор вашей адвокатской практики</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Последние дела</h2>
              <button
                onClick={() => (window.location.href = '/cases')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Посмотреть все
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentCases.map((case_item) => (
              <div key={case_item.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{case_item.title}</h3>
                  <p className="text-sm text-slate-600">Клиент: {case_item.client}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(case_item.status)}`}>
                      {case_item.status === 'active' ? 'Активное' : case_item.status === 'paused' ? 'Приостановлено' : 'Завершено'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(case_item.priority)}`}>
                      {case_item.priority === 'high' ? 'Высокий' : case_item.priority === 'medium' ? 'Средний' : 'Низкий'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{case_item.updatedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Ближайшие события</h2>
              <button
                onClick={() => (window.location.href = '/calendar')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Календарь
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {event.type === 'court_hearing' && <Scale className="w-5 h-5 text-blue-600" />}
                  {event.type === 'meeting' && <Users className="w-5 h-5 text-blue-600" />}
                  {event.type === 'deadline' && <Clock className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{event.title}</h3>
                  <p className="text-sm text-slate-600">{event.date} в {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => console.log('Create case clicked')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <Briefcase className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-slate-900">Создать дело</p>
            <p className="text-sm text-slate-600">Новое дело с клиентом</p>
          </button>
          <button
            onClick={() => (window.location.href = '/clients')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
          >
            <Users className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-slate-900">Добавить клиента</p>
            <p className="text-sm text-slate-600">Новый клиент в базу</p>
          </button>
          <button
            onClick={() => (window.location.href = '/documents')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
          >
            <FileText className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-slate-900">Загрузить документ</p>
            <p className="text-sm text-slate-600">С OCR обработкой</p>
          </button>
          <button
            onClick={() => (window.location.href = '/calendar')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
          >
            <Calendar className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-medium text-slate-900">Создать событие</p>
            <p className="text-sm text-slate-600">Встреча или дедлайн</p>
          </button>
        </div>
      </div>
    </div>
  )
}