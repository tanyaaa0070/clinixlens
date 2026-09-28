import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { Overview } from './pages/Overview';
import { NewAnalysis } from './pages/NewAnalysis';
import { Workspace } from './pages/Workspace';
import { ReportView } from './pages/ReportView';
import { EvidenceViewer } from './pages/EvidenceViewer';
import { History } from './pages/History';
import { SyntheticStudio } from './pages/SyntheticStudio';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="new-analysis" element={<NewAnalysis />} />
            <Route path="workspace/:id" element={<Workspace />} />
            <Route path="report/:id" element={<ReportView />} />
            <Route path="evidence/:id" element={<EvidenceViewer />} />
            <Route path="history" element={<History />} />
            <Route path="synthetic-cases" element={<SyntheticStudio />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
