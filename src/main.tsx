import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from './app/toast'
import { RouterProvider } from 'react-router'
import './styles/index.css'
import './styles/refinement.css'
import { router } from './router'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError: (error) => toast({ kind: 'info', title: 'Change not saved', body: error.message }) }),
  defaultOptions: {
    queries: { staleTime: 4_000, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
