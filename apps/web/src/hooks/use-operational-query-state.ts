import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  readOperationalQueryState,
  writeOperationalQueryState,
  type OperationalQueryState,
} from '@/lib/operational-utils'

type OperationalQueryOptions = {
  defaultSortBy?: string
  extraKeys?: string[]
}

export function useOperationalQueryState({ defaultSortBy, extraKeys = [] }: OperationalQueryOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryKey = searchParams.toString()
  const extraKeysKey = extraKeys.join('|')
  const query = useMemo(() => {
    const params = new URLSearchParams(queryKey)
    const base = readOperationalQueryState(params)
    const keys = extraKeysKey.length > 0 ? extraKeysKey.split('|') : []
    const extras = Object.fromEntries(
      keys.map((key) => [key, params.get(key)?.trim() || undefined]),
    )

    return {
      ...base,
      sort_by: base.sort_by ?? defaultSortBy,
      ...extras,
    }
  }, [defaultSortBy, extraKeysKey, queryKey])

  const updateQuery = useCallback(
    (next: Partial<OperationalQueryState> & Record<string, string | number | undefined | null>) => {
      setSearchParams(writeOperationalQueryState(searchParams, next))
    },
    [searchParams, setSearchParams],
  )

  return {
    query,
    queryKey,
    searchParams,
    updateQuery,
  }
}
