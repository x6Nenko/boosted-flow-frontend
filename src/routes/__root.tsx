import { Outlet, createRootRouteWithContext, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { CommandPalette } from '@/features/command-palette'
import { useGlobalHotkeys } from '@/features/hotkeys'
import { getDocumentTitleForPath } from '@/lib/page-title'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

function RootComponent() {
  const { pathname } = useLocation();

  useGlobalHotkeys();

  useEffect(() => {
    document.title = getDocumentTitleForPath(pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4">
        <Outlet />
      </main>
      <CommandPalette />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})
