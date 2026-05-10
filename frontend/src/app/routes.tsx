import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '@/pages/HomePage';
import { WalletsPage } from '@/pages/WalletsPage';
import { LotteriesPage } from '@/pages/LotteriesPage';
import { LotteryDetailsPage } from '@/pages/LotteryDetailsPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { Layout } from '@/widgets/Layout';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'wallets', element: <WalletsPage /> },
      { path: 'lotteries', element: <LotteriesPage /> },
      { path: 'lotteries/:lotteryId', element: <LotteryDetailsPage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
    ],
  },
]);
