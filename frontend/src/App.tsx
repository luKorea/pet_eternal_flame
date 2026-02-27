import { Provider, useAtomValue } from 'jotai'
import { AntdProvider } from '@/components/AntdProvider'
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen'
import { AppRouter } from '@/router'
import { useAuthInit } from '@/hooks/useAuthInit'
import { authReadyAtom } from '@/store/atoms'

function AppContent() {
  useAuthInit()
  const authReady = useAtomValue(authReadyAtom)

  if (!authReady) {
    return <AuthLoadingScreen />
  }

  return <AppRouter />
}

function App() {
  return (
    <Provider>
      <AntdProvider>
        <AppContent />
      </AntdProvider>
    </Provider>
  )
}

export default App
