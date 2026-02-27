import { Layout } from '@/components/Layout'
import { RitualForm } from './components/RitualForm'
import { ResultPanel } from './components/ResultPanel'

/** 首页：祭祀表单 + 结果展示 */
export function HomePage() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <RitualForm />
        <ResultPanel />
      </div>
    </Layout>
  )
}
