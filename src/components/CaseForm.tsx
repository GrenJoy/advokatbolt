import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Briefcase, User, FileText, Building, Scale, Tag } from 'lucide-react'
import { useCreateCase, useUpdateCase } from '../hooks/useCases'
import { useClients } from '../hooks/useClients'
import { Case } from '../types'

interface CaseFormProps {
  case?: Case | null
  isOpen: boolean
  onClose: () => void
}

interface CaseFormData {
  case_number: string
  title: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client_id: string
  case_type: string
  court_instance?: string
  opposing_party?: string
  internal_notes?: string
  tags: string[]
}

export function CaseForm({ case: caseData, isOpen, onClose }: CaseFormProps) {
  const createCase = useCreateCase()
  const updateCase = useUpdateCase()
  const { data: clients = [] } = useClients()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CaseFormData>({
    defaultValues: {
      case_number: '',
      title: '',
      description: '',
      status: 'active',
      priority: 'medium',
      client_id: '',
      case_type: '',
      court_instance: '',
      opposing_party: '',
      internal_notes: '',
      tags: []
    }
  })

  // Сброс формы при изменении дела
  useEffect(() => {
    if (caseData) {
      const formData = {
        case_number: caseData.case_number,
        title: caseData.title,
        description: caseData.description,
        status: caseData.status,
        priority: caseData.priority,
        client_id: caseData.client_id,
        case_type: caseData.case_type,
        court_instance: caseData.court_instance || '',
        opposing_party: caseData.opposing_party || '',
        internal_notes: caseData.internal_notes || '',
        tags: caseData.tags || []
      }
      reset(formData)
      setTagsInput(caseData.tags?.join(', ') || '')
    } else {
      reset({
        case_number: '',
        title: '',
        description: '',
        status: 'active',
        priority: 'medium',
        client_id: '',
        case_type: '',
        court_instance: '',
        opposing_party: '',
        internal_notes: '',
        tags: []
      })
      setTagsInput('')
    }
  }, [caseData, reset])

  const watchedTags = watch('tags')

  const handleTagsChange = (value: string) => {
    setTagsInput(value)
    const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setValue('tags', tagsArray)
  }

  const onSubmit = async (data: CaseFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (caseData) {
        await updateCase.mutateAsync({ id: caseData.id, updates: data })
      } else {
        await createCase.mutateAsync(data)
      }
      reset()
      setTagsInput('')
      onClose()
    } catch (error: any) {
      console.error('Ошибка при сохранении дела:', error)
      setError(error?.message || 'Произошла ошибка при сохранении дела')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {caseData ? 'Редактировать дело' : 'Создать дело'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-close-case-form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Номер дела
              </label>
              <input
                type="text"
                {...register('case_number')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A40-123456/2024 (можно заполнить позже)"
                data-testid="input-case-number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Клиент
              </label>
              <select
                {...register('client_id')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="select-client"
              >
                <option value="">Выберите клиента (можно добавить позже)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Название дела *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Название дела обязательно' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Трудовой спор ООО Альфа"
              data-testid="input-case-title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Описание дела *
            </label>
            <textarea
              {...register('description', { required: 'Описание дела обязательно' })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Краткое описание дела и его обстоятельств"
              data-testid="input-case-description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Статус
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="select-case-status"
              >
                <option value="active">Активное</option>
                <option value="paused">Приостановлено</option>
                <option value="completed">Завершено</option>
                <option value="archived">Архив</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Приоритет
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="select-case-priority"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Scale className="w-4 h-4 inline mr-1" />
                Тип дела
              </label>
              <input
                type="text"
                {...register('case_type')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Трудовое право (можно заполнить позже)"
                data-testid="input-case-type"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Building className="w-4 h-4 inline mr-1" />
                Суд
              </label>
              <input
                type="text"
                {...register('court_instance')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Арбитражный суд г. Москвы"
                data-testid="input-court-instance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Противоположная сторона
              </label>
              <input
                type="text"
                {...register('opposing_party')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ООО Альфа"
                data-testid="input-opposing-party"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Tag className="w-4 h-4 inline mr-1" />
              Теги (через запятую)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="трудовой спор, восстановление, компенсация"
              data-testid="input-case-tags"
            />
            {watchedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {watchedTags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs text-blue-700 bg-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Внутренние заметки
            </label>
            <textarea
              {...register('internal_notes')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Внутренние заметки, видимые только вам"
              data-testid="input-internal-notes"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              data-testid="button-cancel-case"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              data-testid="button-save-case"
            >
              {isSubmitting ? 'Сохранение...' : (caseData ? 'Сохранить' : 'Создать дело')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}