import { RouterProvider } from 'react-router-dom';

import { SessionBootstrap } from '@/app/providers/SessionBootstrap';
import { TonConnectDebugObserver } from '@/app/providers/TonConnectDebugObserver';
import { appRouter } from '@/app/routes';

export const App = () => {
  return (
    <>
      <TonConnectDebugObserver />
      <SessionBootstrap>
        <RouterProvider router={appRouter} />
      </SessionBootstrap>
    </>
  );
};
