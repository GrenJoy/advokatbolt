import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../lib/api'
import { Client } from '../types'

// Хук для получения всех клиентов
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  })
}

// Хук для создания клиента
export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// Хук для обновления клиента
export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) =>
      clientsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// Хук для удаления клиента
export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}