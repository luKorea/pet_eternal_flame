import { Form, DatePicker, Button, Input } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useCalculate } from '@/hooks/useCalculate'

interface FormValues {
  deathDate: Dayjs
  petName?: string
}

export function RitualForm() {
  const { t } = useTranslation()
  const { trigger, loading } = useCalculate()
  const [form] = Form.useForm<FormValues>()

  const onFinish = (values: FormValues) => {
    trigger({
      deathDate: values.deathDate.format('YYYY-MM-DD'),
      petName: values.petName?.trim() || undefined,
    })
  }

  return (
    <section className="rounded-lg border border-flame-gold/30 bg-flame-ink/50 p-6 shadow-xl backdrop-blur sm:p-8">
      <h2 className="mb-4 text-lg font-semibold text-flame-gold sm:text-xl">
        {t('form.title')}
      </h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="ritual-form"
      >
        <Form.Item
          name="deathDate"
          label={
            <>
              {t('form.deathDateLabel')}{' '}
              <span className="text-flame-red">{t('form.required')}</span>
            </>
          }
          rules={[
            {
              required: true,
              message: t('form.pleaseSelectDate'),
            },
          ]}
        >
          <DatePicker
            className="w-full"
            format="YYYY-MM-DD"
            placeholder={t('form.datePlaceholder')}
            disabledDate={(d: Dayjs | null) => (d ? d.isAfter(dayjs(), 'day') : false)}
          />
        </Form.Item>
        <Form.Item name="petName" label={t('form.petNameLabel')}>
          <Input
            placeholder={t('form.petNamePlaceholder')}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!bg-flame-gold hover:!bg-flame-gold/90 !border-0"
          >
            {loading ? t('form.submitting') : t('form.submit')}
          </Button>
        </Form.Item>
      </Form>
    </section>
  )
}
