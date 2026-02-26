import { Provider } from 'jotai'
import { Layout } from '@/components/Layout'
import { RitualForm } from '@/components/RitualForm'
import { ResultPanel } from '@/components/ResultPanel'

function App() {
  return (
    <Provider>
      <Layout>
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <RitualForm />
          <ResultPanel />
        </div>
      </Layout>
    </Provider>
  )
}

export default App
