import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  updateFn,
}: {
  mutationFn: (vars: TVariables) => Promise<TData>
  queryKey: string[]
  updateFn: (oldData: TData | undefined, vars: TVariables) => TData
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<TData>(queryKey)
      queryClient.setQueryData(queryKey, (old: TData | undefined) => updateFn(old, vars))
      return { prev }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
