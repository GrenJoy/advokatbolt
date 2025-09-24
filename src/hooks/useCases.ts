import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { casesApi } from '../lib/api'
import { Case } from '../types'

// Хук для получения всех дел
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
  })
}

// Хук для получения дела по ID
export function useCase(id: string) {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: () => casesApi.getById(id),
    enabled: !!id,
  })
}

// Хук для создания дела
export function useCreateCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

// Хук для обновления дела
export function useUpdateCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Case> }) =>
      casesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

// Хук для удаления дела
export function useDeleteCase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: casesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}