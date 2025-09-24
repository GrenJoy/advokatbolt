import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  User,
  Building,
  Tag,
  FileText,
  MessageSquare
} from 'lucide-react'
import { useCases, useDeleteCase } from '../hooks/useCases'
import { CaseForm } from '../components/CaseForm'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentsList } from '../components/DocumentsList'

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cases = [] } = useCases()
  const deleteCase = useDeleteCase()
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'chat'>('overview')

  const currentCase = cases.find(c => c.id === id)

  if (!currentCase) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Дело не найдено
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это дело?')) {
      try {
        await deleteCase.mutateAsync(currentCase.id)
        navigate('/cases')
      } catch (error) {
        console.error('Ошибка при удалении дела:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-slate-100 text-slate-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cases')}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-case-title">
              {currentCase.title}
            </h1>
            <p className="text-slate-600">{currentCase.case_number}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            data-testid="button-edit-case"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            data-testid="button-delete-case"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-overview"
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Обзор
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'documents' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-documents"
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Документы
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'chat' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-chat"
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            AI Чат
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Case Info */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Информация о деле</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Описание</h3>
                <p className="text-slate-600">{currentCase.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Клиент</h3>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{currentCase.client?.name}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Статус и приоритет</h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentCase.status)}`}>
                    {currentCase.status === 'active' ? 'Активное' : 
                     currentCase.status === 'paused' ? 'Приостановлено' : 
                     currentCase.status === 'completed' ? 'Завершено' : 'Архив'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(currentCase.priority)}`}>
                    {currentCase.priority === 'urgent' ? 'Срочный' :
                     currentCase.priority === 'high' ? 'Высокий' :
                     currentCase.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
              </div>

              {currentCase.court_instance && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Суд</h3>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{currentCase.court_instance}</span>
                  </div>
                </div>
              )}

              {currentCase.opposing_party && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Противоположная сторона</h3>
                  <p className="text-slate-600">{currentCase.opposing_party}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Тип дела</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {currentCase.case_type}
                </span>
              </div>
            </div>

            {currentCase.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Теги</h3>
                <div className="flex flex-wrap gap-2">
                  {currentCase.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-600 bg-slate-100">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentCase.internal_notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Внутренние заметки</h3>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{currentCase.internal_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <DocumentUpload caseId={currentCase.id} />
          <DocumentsList caseId={currentCase.id} />
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Чат</h2>
          <p className="text-slate-600">AI чат функциональность будет добавлена в следующей версии.</p>
        </div>
      )}

      {/* Edit Form Modal */}
      <CaseForm
        case={currentCase}
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
      />
    </div>
  )
}