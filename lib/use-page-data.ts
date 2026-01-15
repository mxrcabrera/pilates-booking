'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCachedData, setCachedData } from './client-cache'

type UsePageDataOptions<T> = {
  cacheKey: string
  apiUrl: string
  transform?: (data: unknown) => T
}

type UsePageDataResult<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
  refresh: () => void
}

export function usePageData<T>({
  cacheKey,
  apiUrl,
  transform
}: UsePageDataOptions<T>): UsePageDataResult<T> {
  const router = useRouter()
  const [data, setData] = useState<T | null>(() => {
    const cached = getCachedData<T>(cacheKey)
    return cached ? (transform ? transform(cached) : cached) : null
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!data)
  // Track the current cacheKey to detect page changes
  const [currentKey, setCurrentKey] = useState(cacheKey)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(apiUrl)
      const responseData = await res.json()

      if (responseData.error) {
        setError(responseData.error)
      } else if (responseData.redirect) {
        router.push(responseData.redirect)
      } else if (responseData.preferencesIncomplete) {
        setData(responseData as T)
      } else {
        setCachedData(cacheKey, responseData)
        setData(transform ? transform(responseData) : responseData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when cacheKey changes (page navigation)
  useEffect(() => {
    if (cacheKey !== currentKey) {
      setCurrentKey(cacheKey)
      const cached = getCachedData<T>(cacheKey)
      if (cached) {
        setData(transform ? transform(cached) : cached)
        setIsLoading(false)
      } else {
        setData(null)
        setIsLoading(true)
        fetchData()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, currentKey])

  // Initial fetch on mount if no cached data
  useEffect(() => {
    if (!data && cacheKey === currentKey) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = () => {
    setData(null)
    fetchData()
  }

  return { data, error, isLoading: isLoading && !data, refresh }
}
