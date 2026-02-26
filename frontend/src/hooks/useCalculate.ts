import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { calculateRitual } from '@/api/endpoints/calculate'
import { getApiLocale } from '@/i18n'
import {
  resultAtom,
  errorAtom,
  lastSubmittedParamsAtom,
} from '@/store/atoms'
import type { CalculateRequest, CalculateResponse } from '@/types/api'

const RITUAL_KEY_PREFIX = 'ritual'

function ritualFetcher([, deathDate, petName, locale]: [
  string,
  string,
  string,
  string,
]): Promise<CalculateResponse> {
  return calculateRitual({
    deathDate,
    petName: petName || undefined,
    locale,
  })
}

export function useCalculate() {
  const { i18n } = useTranslation()
  const lastSubmitted = useAtomValue(lastSubmittedParamsAtom)
  const setResult = useSetAtom(resultAtom)
  const setError = useSetAtom(errorAtom)
  const setLastSubmittedParams = useSetAtom(lastSubmittedParamsAtom)

  const locale = getApiLocale(i18n.language)
  const prevLocaleRef = useRef(locale)
  // key 含 (deathDate, petName, locale)：SWR 按 key 缓存，相同 key 直接用缓存不重复请求
  // 例如先请求 zh 再切到 en 会请求一次，再切回 zh 时命中缓存，不再请求
  const key =
    lastSubmitted != null
      ? ([RITUAL_KEY_PREFIX, lastSubmitted.deathDate, lastSubmitted.petName ?? '', locale] as const)
      : null

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    ritualFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // 相同 key 直接复用缓存，不重复请求；只有 key 变化（如切换语言）才请求
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    },
  )

  // 切换语言时清空旧结果，避免短暂展示旧语言，等 SWR 用新 key 请求后再展示
  useEffect(() => {
    if (lastSubmitted != null && prevLocaleRef.current !== locale) {
      setResult(null)
      setError(null)
    }
    prevLocaleRef.current = locale
  }, [locale, lastSubmitted, setResult, setError])

  useEffect(() => {
    if (data != null) {
      setResult(data)
      setError(null)
    }
  }, [data, setResult, setError])

  useEffect(() => {
    if (error != null) {
      setError(error?.message ?? 'error.requestFailed')
      setResult(null)
    }
  }, [error, setError, setResult])

  const trigger = (payload: CalculateRequest) => {
    setError(null)
    setResult(null)
    setLastSubmittedParams({
      deathDate: payload.deathDate,
      petName: payload.petName,
    })
  }

  const reset = () => {
    setLastSubmittedParams(null)
    setResult(null)
    setError(null)
    mutate(undefined, false)
  }

  return {
    trigger,
    result: data ?? null,
    error: error?.message ?? null,
    loading: isLoading || isValidating,
    reset,
  }
}
