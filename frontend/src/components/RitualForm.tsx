import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deathDateAtom, errorAtom, petNameAtom, resultAtom } from '@/store/atoms'
import { useCalculate } from '@/hooks/useCalculate'

export function RitualForm() {
  const { t } = useTranslation()
  const [deathDate, setDeathDate] = useAtom(deathDateAtom)
  const [petName, setPetName] = useAtom(petNameAtom)
  const setResult = useSetAtom(resultAtom)
  const setError = useSetAtom(errorAtom)
  const [touched, setTouched] = useState(false)
  const { trigger, loading } = useCalculate()

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!deathDate.trim()) {
        setTouched(true)
        return
      }
      setError(null)
      setResult(null)
      trigger({
        deathDate: deathDate.trim(),
        petName: petName.trim() || undefined,
      })
    },
    [deathDate, petName, trigger, setResult, setError]
  )

  return (
    <section className="rounded-lg border border-flame-gold/30 bg-flame-ink/50 p-6 shadow-xl backdrop-blur sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-flame-gold sm:text-xl">
        {t('form.title')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="deathDate" className="block text-sm text-flame-paper/90">
            {t('form.deathDateLabel')} <span className="text-flame-red">{t('form.required')}</span>
          </label>
          <input
            id="deathDate"
            type="date"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            className="mt-1 block w-full rounded border border-flame-gold/40 bg-flame-dark/80 px-3 py-2 text-flame-paper placeholder-flame-paper/50 focus:border-flame-gold focus:outline-none focus:ring-1 focus:ring-flame-gold sm:text-base"
            max={new Date().toISOString().slice(0, 10)}
          />
          {touched && !deathDate && (
            <p className="mt-1 text-sm text-flame-red">{t('form.pleaseSelectDate')}</p>
          )}
        </div>
        <div>
          <label htmlFor="petName" className="block text-sm text-flame-paper/90">
            {t('form.petNameLabel')}
          </label>
          <input
            id="petName"
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder={t('form.petNamePlaceholder')}
            className="mt-1 block w-full rounded border border-flame-gold/40 bg-flame-dark/80 px-3 py-2 text-flame-paper placeholder-flame-paper/50 focus:border-flame-gold focus:outline-none focus:ring-1 focus:ring-flame-gold sm:text-base"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-flame-gold/90 py-3 font-semibold text-flame-dark transition hover:bg-flame-gold disabled:opacity-50 sm:py-3.5"
        >
          {loading ? t('form.submitting') : t('form.submit')}
        </button>
      </form>
    </section>
  )
}
