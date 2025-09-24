import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, User, Mail, Phone, MapPin } from 'lucide-react'
import { useCreateClient, useUpdateClient } from '../hooks/useClients'
import { Client } from '../types'

interface ClientFormProps {
  client?: Client | null
  isOpen: boolean
  onClose: () => void
}

interface ClientFormData {
  name: string
  email: string
  phone: string
  address: string
}

export function ClientForm({ client, isOpen, onClose }: ClientFormProps) {
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: ''
    }
  })

  // Сброс формы при изменении клиента
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address || ''
      })
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        address: ''
      })
    }
  }, [client, reset])

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      if (client) {
        await updateClient.mutateAsync({ id: client.id, updates: data })
      } else {
        await createClient.mutateAsync(data)
      }
      reset()
      onClose()
    } catch (error) {
      console.error('Ошибка при сохранении клиента:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {client ? 'Редактировать клиента' : 'Добавить клиента'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="button-close-form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Имя клиента *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Имя обязательно' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Иванов Иван Иванович"
              data-testid="input-client-name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Неверный формат email'
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ivanov@example.com"
              data-testid="input-client-email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Телефон *
            </label>
            <input
              type="tel"
              {...register('phone', { required: 'Телефон обязателен' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (999) 123-45-67"
              data-testid="input-client-phone"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Адрес
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="г. Москва, ул. Ленина, д. 1, кв. 10"
              data-testid="input-client-address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              data-testid="button-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              data-testid="button-save-client"
            >
              {isSubmitting ? 'Сохранение...' : (client ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}