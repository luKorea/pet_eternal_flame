import { useAtomValue } from 'jotai'
import { Trans, useTranslation } from 'react-i18next'
import { errorAtom, resultAtom } from '@/store/atoms'

export function ResultPanel() {
  const { t } = useTranslation()
  const result = useAtomValue(resultAtom)
  const error = useAtomValue(errorAtom)

  if (error) {
    const message = error.startsWith('error.') ? t(error) : error
    return (
      <section className="rounded-lg border border-red-500/50 bg-red-950/30 p-6 text-red-200">
        <p>{message}</p>
      </section>
    )
  }

  if (!result) return null

  return (
    <section className="rounded-lg border border-flame-gold/30 bg-flame-ink/50 p-6 shadow-xl backdrop-blur sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-flame-gold sm:text-xl">
        {t('result.title')}
      </h2>

      {result.petName && (
        <p className="mb-2 text-flame-paper/90">
          <span className="text-flame-gold">{t('result.petLabel')}</span>
          {result.petName}
        </p>
      )}

      <div className="mb-4 rounded border border-flame-gold/20 bg-flame-dark/60 p-4">
        <p className="text-flame-paper/95">
          <Trans
            i18nKey="result.petMonthsIntro"
            values={{ count: result.petMonths }}
            components={{ 0: <strong className="text-flame-gold" /> }}
          />
        </p>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 font-medium text-flame-gold">{t('result.suggestedQuantity')}</h3>
        <p className="text-2xl font-bold text-flame-paper sm:text-3xl">
          {result.suggestedQuantity}{' '}
          <span className="text-base font-normal text-flame-paper/80">
            {t('result.quantityUnit')}
          </span>
        </p>
        <p className="mt-1 text-sm text-flame-paper/70">
          {t('result.quantityNote')}
        </p>
      </div>

      {result.burningDates.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 font-medium text-flame-gold">{t('result.luckyDates')}</h3>
          <ul className="space-y-2">
            {result.burningDates.map((item) => (
              <li
                key={item.date}
                className="flex flex-wrap items-baseline gap-2 rounded border border-flame-gold/20 bg-flame-dark/40 px-3 py-2 text-sm sm:flex-nowrap"
              >
                <span className="font-medium text-flame-paper">{item.date}</span>
                <span className="text-flame-paper/80">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded border border-flame-gold/20 bg-flame-dark/40 p-4">
        <h3 className="mb-2 font-medium text-flame-gold">{t('result.explanationTitle')}</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-flame-paper/90">
          {result.explanation}
        </p>
      </div>
    </section>
  )
}
