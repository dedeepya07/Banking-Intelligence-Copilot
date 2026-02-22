import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import QueryAssistantPage from './pages/QueryAssistantPage';
import TransactionsPage from './pages/TransactionsPage';
import FraudIntelligencePage from './pages/FraudIntelligencePage';
import RiskAnalyticsPage from './pages/RiskAnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AdminPage from './pages/AdminPage';
import ScheduledReportsPage from './pages/ScheduledReportsPage';
import QuantumFraudIntelligencePage from './pages/QuantumFraudIntelligencePage';
import QueryGovernancePage from './pages/QueryGovernancePage';
import ComponentShowcase from './components/DesignSystemShowcase';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'query',
        Component: QueryAssistantPage,
      },
      {
        path: 'transactions',
        Component: TransactionsPage,
      },
      {
        path: 'fraud',
        Component: FraudIntelligencePage,
      },
      {
        path: 'quantum-fraud',
        Component: QuantumFraudIntelligencePage,
      },
      {
        path: 'analytics',
        Component: RiskAnalyticsPage,
      },
      {
        path: 'audit',
        Component: AuditLogsPage,
      },
      {
        path: 'admin',
        Component: AdminPage,
      },
      {
        path: 'scheduled',
        Component: ScheduledReportsPage,
      },
      {
        path: 'governance',
        Component: QueryGovernancePage,
      },
    ],
  },
  {
    path: '/design-system',
    Component: ComponentShowcase,
  },
]);