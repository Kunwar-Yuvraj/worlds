import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage'));
const WorkspacePage = React.lazy(() => import('./features/editor/WorkspacePage'));
const LandingPage = React.lazy(() => import('./features/landing/LandingPage'));
const AuthorLandingPage = React.lazy(() => import('./features/landing/AuthorLandingPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteCanvas: React.FC = () => {
  const location = useLocation();
  return (
    <div className="spectral-shell">
      <div key={`beam-${location.pathname}`} className="route-beam" />
      <div key={location.pathname} className="route-reveal min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/kalamish" element={<AuthorLandingPage />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspace/:novelId" element={<WorkspacePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <React.Suspense
          fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-vscode-bg text-vscode-text">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-vscode-accent border-t-transparent" />
                <span className="text-sm font-medium text-vscode-muted">Loading AI Novel Platform...</span>
              </div>
            </div>
          }
        >
          <RouteCanvas />
        </React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
